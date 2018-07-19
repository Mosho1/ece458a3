import * as React from 'react';
import { observer } from 'mobx-react';
import AppState from '../stores/AppState';
import Link from './Link';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { Grid, Paper, Theme, WithStyles, FormControl, InputLabel, Input, Button, CircularProgress } from '@material-ui/core';
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
  context: 'login' | 'register'
}

@observer
export class Login extends React.Component<Props, any> {

  constructor(props: Props) {
    super(props);
    if (props.appState.login) {
      this.mState = props.appState.login.mState;
    }
    runInAction(() => {
      props.appState.login = this;
    });
  }

  componentDidMount() {
    this.resetForm();
  }

  @observable mState = {
    loading: false,
    form: {
      username: '',
      email: '',
      password: ''
    }
  };

  @action
  resetForm() {
    this.mState.loading = false;
    this.mState.form = {
      username: '',
      email: '',
      password: ''
    };
  }

  async login() {
    const {appState} = this.props;
    const res = await appState.apiRequest('login', {
      method: 'POST',
      body: JSON.stringify({
        username: this.mState.form.username,
        password: this.mState.form.password,
      })
    });
    runInAction(() => {
      appState.loggedInAs = this.mState.form.username;
    });
    appState.goTo('/add');
    this.resetForm();
  }

  async register() {
    await this.props.appState.apiRequest('register', {
      method: 'POST',
      body: JSON.stringify({
        username: this.mState.form.username,
        email: this.mState.form.email,
        password: this.mState.form.password,
      })
    });
    this.resetForm();
  }

  onSubmit = action(async (e: any) => {
    e.preventDefault();
    const { context, appState } = this.props;
    try {
      this.mState.loading = true;
      switch (context) {
        case 'login': await this.login(); break;
        case 'register': await this.register(); break;
      }
    } finally {
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

  render() {
    const { context, appState, classes } = this.props;
    return (
      <Grid justify="center" container spacing={24}>
        <Grid item xs={12} sm={10} md={8} lg={4} xl={3}>
          <Paper className={classes.paper}>
            <Grid justify="center" container>
              <form onSubmit={this.onSubmit} className={classes.form}>
                <Grid item xs={12}>
                  <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="username">Name</InputLabel>
                    <Input
                      id="username"
                      value={this.mState.form.username}
                      onChange={this.onChangeUsername} />
                  </FormControl>
                </Grid>
                {context === 'register' && <Grid item xs={12}>
                  <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="email">Email</InputLabel>
                    <Input
                      id="email"
                      value={this.mState.form.email}
                      onChange={this.onChangeEmail} />
                  </FormControl>
                </Grid>}
                <Grid item xs={12}>
                  <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <Input
                      id="password"
                      value={this.mState.form.password}
                      onChange={this.onChangePassword} />
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
                      {context === 'register' ? 'Register' : 'Login'}
                    </Button>
                    {this.mState.loading &&
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgress}
                      />}
                  </FormControl>
                </Grid>
              </form>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(Login);
