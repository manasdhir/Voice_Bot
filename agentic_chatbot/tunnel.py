from pyngrok import ngrok

backend_tunnel = ngrok.connect(8000, bind_tls=True)
print("Backend URL:", backend_tunnel.public_url)

input("Press Enter to stop tunnels and exit...\n")
ngrok.disconnect(backend_tunnel.public_url)