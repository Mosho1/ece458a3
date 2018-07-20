import * as React from 'react';
import { observer } from 'mobx-react';
import AppState from '../stores/AppState';
import Link from './Link';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { Grid, Paper, Theme, WithStyles, FormControl, InputLabel, Input, Button, CircularProgress, Typography } from '@material-ui/core';
import { action, observable, runInAction } from 'mobx';
import { green } from '@material-ui/core/colors';

const styles = (theme: Theme) => createStyles({
  paper: {
    padding: theme.spacing.unit * 4,
    marginTop: theme.spacing.unit * 4,
    textAlign: 'center',
    position: 'relative',
    color: theme.palette.text.secondary,
  },
  loading: {
    color: green[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
});

interface Props extends WithStyles<typeof styles> {
  appState: AppState
}

@observer
export class Confirm extends React.Component<Props, any> {

  get content() {
    const { appState, classes } = this.props;
    switch (appState.confirmAccountStatus) {
      case null: return null;
      case 'start': return <CircularProgress
        size={24}
        className={classes.loading}
      />
      case 'success': return <Typography>Your account has been activated!</Typography>
      case 'failure': return <Typography>Could not activate your account</Typography>
    }
  }

  render() {
    const { classes, appState } = this.props;
    return (
      <Grid justify="center" container spacing={24}>
        <Grid item xs={12} sm={10} md={8} lg={4} xl={3}>
          <Paper className={classes.paper}>
            {this.content}
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(Confirm);
