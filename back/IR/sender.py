import socket
import time
import json
import datetime
from time import sleep
import pickle

# Create a socket object
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Get the hostname and port
host = ''
port = 12345

# Bind the socket to a specific address and port
server_socket.bind((host, port))

# Listen for incoming connections
server_socket.listen()

# Accept a connection
client_socket, client_address = server_socket.accept()

def to_dict(text):
    obj = json.loads(text)
    obj['created_at'] = datetime.datetime.strptime(obj['created_at'], '%a %b %d %H:%M:%S +0000 %Y')
    return obj

file_gen = (line for line in open('IR/tweets.json',encoding="utf8"))
# Run the server loop forever
cnt = 0
while True:
    finished = False
    # Receive a message from the client
    message = client_socket.recv(100000)    
    # Send a response back to the client
    chunk_size = 20
    data = []
    try:
        for i in range(chunk_size):
            data.append(next(file_gen))
        
    except StopIteration:
        if len(data) == 0:
            client_socket.sendall("Finished".encode())
            client_socket.close()
            # Close the server socket
            server_socket.close()
            break
        

    data_string = json.dumps(data,default=str)

    client_socket.sendall(data_string.encode())
    sleep(0.5)
    
    # handle exiting the loop  here and in the client
    # try to make chunks of data not single tweets
    
  


    # Sleep for 2 seconds

# Close the client socket
