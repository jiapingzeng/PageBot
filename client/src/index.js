import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { SocketProvider } from 'socket.io-react';
import io from 'socket.io-client';
import {BrowserRouter as Router} from 'react-router-dom';
const shortid = require('shortid');
const Cookies = require('js-cookie')

const socket = io.connect('https://pagebot2018.herokuapp.com')
socket.on('connect', ()=>console.log('success connected'))
// socket.on('disconnect', ()=>alert('You have been disconnected!'))
// const VAPID_KEY = null
let id = Cookies.get('codedaystaffid')
if (!id){
    id = shortid.generate()
    Cookies.set('codedaystaffid', id)
}
ReactDOM.render(<Router><SocketProvider socket={socket}><App id={id}/></SocketProvider></Router>, document.getElementById('root'));

// if (navigator && navigator.serviceWorker) {
//     navigator.serviceWorker
//     .register('/onPushNotif.js')
//     .then(registration => {
//         registration.pushManager
//         .subscribe({
//             userVisibleOnly: true,
//             applicationServerKey: VAPID_KEY
//         })
//         .then(pushSubscription => {
//             console.log(
//                 "Received PushSubscription:",
//                 JSON.stringify(pushSubscription)
//             );
//             return pushSubscription;
//         });
//     })

//     .catch(e => console.error("ServiceWorker failed:", e));
// }
