from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    # Object-level check: the object must belong to the logged-in user.
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
