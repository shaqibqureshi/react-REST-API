from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    # Everything the frontend talks to lives under /api/
    path('api/', include('tasks.urls')),
]
