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
export class Add extends React.Component<Props, any> {

  constructor(props: Props) {
    super(props);
    if (props.appState.add) {
      this.mState = props.appState.add.mState;
    }
    runInAction(() => {
      props.appState.add = this;
    });
  }

  componentDidMount() {
    this.resetForm();
  }

  @observable mState = {
    loading: false,
    form: {
      site: '',
      site_username: '',
      site_password: ''
    }
  };

  @action
  resetForm() {
    this.mState.form = {
      site: '',
      site_username: '',
      site_password: ''
    };
  }

  async addPassword() {
    const res = await this.props.appState.apiRequest('passwords', {
      method: 'POST',
      body: JSON.stringify({
        site: this.mState.form.site,
        site_password: this.mState.form.site_password,
        site_username: this.mState.form.site_username,
      })
    });
    this.resetForm();
  }

  onSubmit = action(async (e: any) => {
    e.preventDefault();
    const { context, appState } = this.props;
    try {
      this.mState.loading = true;
      await this.addPassword();
    } finally {
      runInAction(() => this.mState.loading = false);
    }
  });

  onChangeSite = action((e: React.ChangeEvent<HTMLInputElement>) => {
    this.mState.form.site = e.target.value;
  });

  onChangeSiteUsername = action((e: React.ChangeEvent<HTMLInputElement>) => {
    this.mState.form.site_username = e.target.value;
  });

  onChangeSitePassword = action((e: React.ChangeEvent<HTMLInputElement>) => {
    this.mState.form.site_password = e.target.value;
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
                    <InputLabel htmlFor="username">Site</InputLabel>
                    <Input
                      id="username"
                      value={this.mState.form.site}
                      onChange={this.onChangeSite} />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="email">Username</InputLabel>
                    <Input
                      id="email"
                      value={this.mState.form.site_username}
                      onChange={this.onChangeSiteUsername} />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <Input
                      id="password"
                      value={this.mState.form.site_password}
                      onChange={this.onChangeSitePassword} />
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
                      Add
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

export default withStyles(styles)(Add);