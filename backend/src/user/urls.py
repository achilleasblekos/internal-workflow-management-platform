"""
Url mappings for the user API.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from user import views


app_name = 'user'

urlpatterns = [
    path('register/', views.CreateUserView.as_view(), name='register'),
    path('login/', views.CreateTokenView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('account/', views.ManageUserView.as_view(), name='account'),
]
