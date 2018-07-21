import * as React from 'react';
import { observer } from 'mobx-react';
import AppState from '../stores/AppState';
import Link from './Link';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { Grid, Paper, Theme, WithStyles, FormControl, InputLabel, Input, Button, CircularProgress, Typography } from '@material-ui/core';
import { action, observable, runInAction } from 'mobx';
import { green } from '@material-ui/core/colors';
import Form from './Form';

const styles = (theme: Theme) => createStyles({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  formControl: {
    margin: theme.spacing.unit,
  },
  button: {
    margin: theme.spacing.unit * 2,
  },
  buttonProgress: {
    color: green[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -6,
    marginLeft: -12,
  },
});

interface Props extends WithStyles<typeof styles> {
  appState: AppState;
}

@observer
export class Login extends React.Component<Props, any> {

  componentDidMount() {
    this.resetForm();
  }

  @observable mState = {
    form: {
      username: '',
      email: '',
      password: ''
    }
  };

  @action
  resetForm() {
    this.mState.form = {
      username: '',
      email: '',
      password: ''
    };
  }

  onSubmit = action(async (e: any) => {
    e.preventDefault();
    const { appState } = this.props;
    await appState.login(this.mState.form);
  })

  onChangeUsername = action((e: React.ChangeEvent<HTMLInputElement>) => {
    this.mState.form.username = e.target.value;
  });

  onChangeEmail = action((e: React.ChangeEvent<HTMLInputElement>) => {
    this.mState.form.email = e.target.value;
  });

  onChangePassword = action((e: React.ChangeEvent<HTMLInputElement>) => {
    this.mState.form.password = e.target.value;
  });

  render() {
    const { appState, classes } = this.props;
    return (
      <Grid justify="center" container spacing={24}>
        <Grid item xs={12} sm={10} md={8} lg={4} xl={3}>
          <Paper className={classes.paper}>
            <Grid justify="center" container>
              <Form
                buttonText="Log in"
                errorMessage="Wrong username or password"
                onSubmit={this.onSubmit}>
                <Grid item xs={12}>
                  <FormControl required className={classes.formControl}>
                    <InputLabel htmlFor="username">Username</InputLabel>
                    <Input
                      id="username"
                      value={this.mState.form.username}
                      onChange={this.onChangeUsername} />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl required className={classes.formControl}>
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <Input
                      id="password"
                      type="password"
                      value={this.mState.form.password}
                      onChange={this.onChangePassword} />
                  </FormControl>
                </Grid>
              </Form>
              <Grid item xs={12}>
                <Typography><Link href="/forgot">Forgot password?</Link></Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(Login);
