FROM nginx:alpine

# Copy landing page
COPY index.html /usr/share/nginx/html/index.html

# Copy nginx config (optional, using default for now)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
