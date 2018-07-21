import * as React from 'react';
import { observer } from 'mobx-react';
import AppState from '../stores/AppState';
import Link from './Link';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { Grid, Paper, Theme, WithStyles, FormControl, InputLabel, Input, Button, CircularProgress, FormHelperText, Typography } from '@material-ui/core';
import { action, observable, runInAction } from 'mobx';
import { green } from '@material-ui/core/colors';

const styles = (theme: Theme) => createStyles({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  form: {
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
    marginTop: -12,
    marginLeft: -12,
  },
});

interface Props extends WithStyles<typeof styles> {
  appState: AppState;
}

@observer
export class Register extends React.Component<Props, any> {

  componentDidMount() {
    this.resetForm();
  }

  @observable mState = {
    loading: false,
    passwordMismatch: false,
    form: {
      username: '',
      email: '',
      password: '',
      repeatPassword: '',
    }
  };

  @action
  resetForm() {
    this.mState.loading = false;
    this.mState.passwordMismatch = false;
    this.mState.form = {
      username: '',
      email: '',
      password: '',
      repeatPassword: '',
    };
  }

  onSubmit = action(async (e: any) => {
    e.preventDefault();
    const { appState } = this.props;
    const { form } = this.mState;
    if (form.password !== form.repeatPassword) return;
    try {
      this.mState.loading = true;
      await appState.register(form);
    } finally {
      this.resetForm();
      runInAction(() => this.mState.loading = false);
    }
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

  onChangeRepeatPassword = action((e: React.ChangeEvent<HTMLInputElement>) => {
    const { form } = this.mState;
    form.repeatPassword = e.target.value;
    this.mState.passwordMismatch = form.password !== form.repeatPassword;
  });

  render() {
    const { appState, classes } = this.props;
    return (
      <Grid justify="center" container spacing={24}>
        <Grid item xs={12} sm={10} md={8} lg={4} xl={3}>
          <Paper className={classes.paper}>
            <Grid justify="center" container>
              <form onSubmit={this.onSubmit} className={classes.form}>
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
                    <InputLabel htmlFor="email">Email</InputLabel>
                    <Input
                      type="email"
                      id="email"
                      value={this.mState.form.email}
                      onChange={this.onChangeEmail} />
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
                <Grid item xs={12}>
                  <FormControl error={this.mState.passwordMismatch} required className={classes.formControl}>
                    <InputLabel htmlFor="repeat-password">Repeat password</InputLabel>
                    <Input
                      id="repeat-password"
                      type="password"
                      value={this.mState.form.repeatPassword}
                      onChange={this.onChangeRepeatPassword} />
                    {this.mState.passwordMismatch &&
                      <FormHelperText id="repeat-password-text">Passwords don't match</FormHelperText>
                    }
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl className={classes.formControl}>
                    <Button
                      disabled={this.mState.loading}
                      variant="contained"
                      type="submit"
                      color="primary"
                      className={classes.button}>
                      Register
                    </Button>
                    {this.mState.loading &&
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgress}
                      />}
                  </FormControl>
                </Grid>
              </form>
              <Grid item xs={12}>
                <Typography><Link href="/login">Log in</Link></Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(Register);
