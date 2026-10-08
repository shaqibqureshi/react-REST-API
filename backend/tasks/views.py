from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Task
from .permissions import IsOwner
from .serializers import RegisterSerializer, TaskSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]  # registration must work without a token


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    # The queryset is the ownership filter: a user only ever "sees"
    # their own tasks, so asking for someone else's id returns 404.
    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # request.user is the JWT owner, never trust a user field in the body.
        serializer.save(user=self.request.user)
