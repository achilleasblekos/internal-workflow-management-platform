"""
Serializers for the user API View.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the users object."""

    class Meta:
        model = get_user_model()
        fields = ('email', 'password', 'name')
        extra_kwargs = {'password': {'write_only': True, 'min_length': 5}}

    def create(self, validated_data):
        """Create a new user with encrypted password and return it."""
        return get_user_model().objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        """Update a user, setting the password correctly and return it."""
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user


class AuthTokenSerializer(TokenObtainPairSerializer):
    """Serializer for obtaining JWT token pairs."""
    username_field = 'email'


class LogoutSerializer(serializers.Serializer):
    """Serializer for logging out a user by blacklisting
    their refresh token."""
    refresh = serializers.CharField()

    def save(self, **kwargs):
        """Blacklist the refresh token."""
        try:
            refresh_token = self.validated_data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as e:
            raise serializers.ValidationError(
                {'refresh': 'Invalid or expired token.'}
            ) from e
