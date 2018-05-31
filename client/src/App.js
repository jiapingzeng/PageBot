//TODO: fix arrow/binding functions within render
//TODO: properly use router/redux instead of storing state in memory
//TODO: more styles!

import React, { Component } from 'react'
import './App.css'
import Status from './components/Status'
import Button from './components/Button'
import { socketConnect } from 'socket.io-react'
import Typography from '@material-ui/core/Typography'
import { TextField, Switch } from '@material-ui/core'

import {BrowserRouter as Router, Route} from 'react-router-dom'
import ReactNotifications from 'react-browser-notifications'

let styles = {
  root: {
    fontFamily: 'Helvetica, Arial, Sans-Serif',
    Width: '100%',
    height: '100%',
    margin: '0',
  },
  inner: {
    maxWidth: '666px',
    margin: '0 auto',
    padding: '1rem',
    height: '100%',
    position: 'relative',
    background: 'white'
  },
  footer: {
    position: 'absolute',
    bottom: 10, left: 10,
    display: 'flex',
    justifyContent: 'space-around'
  }
}
styles.requested = {
  ...styles.root,
  background: 'white'
}
styles.baseMsg = {
  margin:'1rem', padding: '1rem',  borderRadius: "5px", color: 'white', background: "#404040"
}
styles.customerMsg = {
  ...styles.baseMsg,
  color: 'white',
  textAlign: 'left',
  background: '#404040'
}
styles.staffMsg = {
  ...styles.baseMsg,
  color: 'black',
  textAlign: 'right',
  background: 'white'
}
const Msg = (props) =>
<div style={props.data.role === "staff"? styles.staffMsg:styles.customerMsg}>
  {props.data.text}
</div>

class App extends Component {
  constructor(props){
    super(props)
    this.showNotifications = this.showNotifications.bind(this);
    this._send = this._send.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.props.socket.on('customer', (data)=>{
      this.showNotifications()
      console.log(data)//
      this.setState({requested: true, customer:{name: data.name, id:data.id, location: data.storeName}})
    })
    this.props.socket.on('cancel', (data)=>{
      if(!this.state.chat) this.setState({requested: false})
    })
    this.props.socket.on('received message',(data)=>{
      if(data.id === this.state.customer.id)
        this.setState({received:this.state.received.concat(data.message)})
    })
 //
    this.state = {
      received: [],
      chat: false,
      msg: '',
      requested: false,
      notificationsEnabled: true,
      customer: {name: 'a customer', location: null, id: null}
    }
  }

  
  handleClick(){
    window.focus()
    this.n.close('abc')
  }
  showNotifications() {
    // If the Notifications API is supported by the browser
    // then show the notification
    if(this.n.supported()) this.n.show();
  }
  _send(method, data){
    // this._notify()
    // console.log('hello')
    if(method === "accept"){
      this._send("send message", {message:"You are now connected to a real-life staff member!",id:this.state.customer.id}) //this line only works before next line 
      this.setState({chat: true, received:[{text:`You're now connected with ${this.state.customer.name}.`, role: "customer"}]})
    }
    if(method === "send message" && this.state.msg.trim().length>0){
      // let temp = this.state.received
      this.setState({received: this.state.received.concat({text: this.state.msg, role: 'staff'}), msg:""})
      // this.setState({chat:false, requested: false})
    }
    this.props.socket.emit(method, data)

  }
  componentDidMount(){
    //react listening stuff
    let permission = Notification.requestPermission()
    permission.then((e)=>
      {
        if(e === "granted") 
          this.setState({notificationsEnabled: true})
        else 
          this.setState({notificationsEnabled: false})
      }
    )
  }
  _notify(){
    if(this.n.supported()) this.n.show();
  }
  render() {
    console.log(this.state.received)
    if(this.state.notificationsEnabled)
    return (
      
      <div style={styles.root}>
        <div style={styles.inner}>
          
        {!this.state.chat &&
          <Status 
            requested={this.state.requested} 
            customer={this.state.customer.name} 
            location={this.state.customer.location} 
            style={styles.status}/>
        }
          {this.state.requested && !this.state.chat && 
          <div>
            <Button id={1} task="accept"  text="Accept" onClick={this._send.bind(this,"accept", {id:this.props.id, userId:this.state.customer.id})}/>
            <Button id={2} task="decline" text="Decline" onClick={()=>{
                this.setState({requested:false}); 
                this._send.bind(this,"decline", { id: this.state.customer.id})
              }}/>
          </div>
          }
          {!this.state.chat &&
           <ReactNotifications
          onRef={ref => (this.n = ref)} // Required
          title="Page Bot" // Required
          body="A customer needs help!"
          icon="logo.png"
          timeout="5555"
          tag="abc"
          onClick={event => this.handleClick(event)}
          />
          }
          {this.state.chat && 
          
            <div style={{width:'100%', textAlign: 'left'}}>
            <Typography variant="display3">Chat</Typography>
            {
              this.state.received.map((obj, i)=>
                <Msg key={i} data={obj}/>
              )
            }
            
            <TextField fullWidth={true} onChange={(e)=>{this.setState({msg: e.target.value})}} value={this.state.msg}/>
            <Button text="Send"  onClick={this._send.bind(this, "send message", {message:this.state.msg,id:this.state.customer.id})}/>
            <Button text="End chat" onClick={()=>{this._send.bind(this, "end chat", {id:this.state.customer.id}); this.setState({received:[], chat:false, requested:false}); window.location.reload()}}/>
            </div>
          }
        </div>
      </div>
    );
    else
    return(<div style={styles.root}>please enable notifications</div>)
  }
}

export default socketConnect(App);
