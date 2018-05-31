import React from 'react'
let styles = {
    main: {
        borderRadius: '5px',
        color: 'white',
        padding: "1rem",
        margin: '0.5rem',
        marginTop: '1.25rem',
        fontSize: '1.25rem',
        textAlign:'center'
        // border: '2px solid white'
    }
}
styles.accept = {
    ...styles.main,
    background: '#4CAF50'
}
styles.decline = {
    ...styles.main,
    background: '#f44336'
}

const Button = (props) => 
    <div onClick={props.onClick} className="button card" style={props.task === "accept" ?styles.accept: styles.decline}>
        {props.text}
    </div>

export default Button