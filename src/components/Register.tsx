import * as React from 'react';
import { observer } from 'mobx-react';
import AppState from '../stores/AppState';
import Link from './Link';
import { withStyles, createStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import FormHelperText from '@material-ui/core/FormHelperText';
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
    passwordMismatch: false,
    form: {
      username: '',
      email: '',
      password: '',
      repeatPassword: '',
    }
  };

  resetForm = action(() => {
    this.mState.passwordMismatch = false;
    this.mState.form = {
      username: '',
      email: '',
      password: '',
      repeatPassword: '',
    };
  })
  onSubmit = action(async (e: any) => {
    e.preventDefault();
    const { appState } = this.props;
    const { form } = this.mState;
    if (form.password !== form.repeatPassword) return;
    await appState.register(form);
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
              <Form
                buttonText="Register"
                successMessage="Check your email!"
                onSuccess={this.resetForm}
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
              </Form>
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
