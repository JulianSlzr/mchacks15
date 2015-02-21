import os
import logging
import gevent
from flask import Flask, render_template
from flask_sockets import Sockets
import io

app = Flask(__name__)
path = os.getcwd()
app.config['DEBUG'] = True
sockets = Sockets(app)

@app.route('/', methods=['GET', 'POST'])
def main():
    return """<html>
    <script type="text/javascript" src="https://cdn.rawgit.com/joewalnes/reconnecting-websocket/63db7ec76e7ca3759815293caf56aa665d989f39/reconnecting-websocket.js"></script>
    <script type="text/javascript">
    window.onload = function() {
        window.sock = new WebSocket("ws://localhost:8000/submit");
        sock.onmessage = function(message) {
            console.log(message.data);
        };
    }
    </script>
    </html>
    """

@sockets.route('/submit')
def sumbit(ws):
    while not ws.closed:
        gevent.sleep()
        data = ws.receive()
        if data:
            wave_file = io.open("test.wav", "ab")
            wave_file.write(data)
            wave_file.close()
