from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Task


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password']

    def create(self, validated_data):
        # create_user hashes the password, never store it as plain text.
        return User.objects.create_user(**validated_data)


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'completed',
                  'created_at', 'updated_at']
        # user is set by the view from request.user, never taken from the body.
        read_only_fields = ['id', 'created_at', 'updated_at']
