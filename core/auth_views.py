from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/auth/login/
    Body: { "username": "alice", "password": "secret" }
    Returns: { "token": "abc123...", "user": { ... } }
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return Response(
            {'detail': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)

    if not user:
        return Response(
            {'detail': 'Invalid credentials. Please try again.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'detail': 'This account has been disabled.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get or create token for this user
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user': {
            'id':         user.id,
            'username':   user.username,
            'email':      user.email,
            'first_name': user.first_name,
            'last_name':  user.last_name,
            'full_name':  user.get_full_name() or user.username,
            'is_staff':   user.is_staff,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    POST /api/auth/logout/
    Deletes the token — user must login again to get a new one.
    """
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'detail': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    GET /api/auth/me/
    Returns current logged-in user info.
    """
    user = request.user
    return Response({
        'id':         user.id,
        'username':   user.username,
        'email':      user.email,
        'first_name': user.first_name,
        'last_name':  user.last_name,
        'full_name':  user.get_full_name() or user.username,
        'is_staff':   user.is_staff,
    })