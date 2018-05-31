import React from 'react'
import Typography from '@material-ui/core/Typography';

let styles = {
    main: {
        color: 'black', 
        marginLeft: '0.5rem',
        marginRight: '0.5rem'
    }
}
const Status = (props) => 
    <Typography style={styles.main} variant="display3">
        {props.requested?`You've been summoned by ${props.customer||"a person"} at ${props.location||"a place"}.`:"No requests… yet."}
    </Typography>

export default Status