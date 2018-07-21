import * as React from 'react';
import { observer } from 'mobx-react';
import AppState from '../stores/AppState';
import Link from './Link';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { Grid, Paper, Theme, WithStyles, FormControl, InputLabel, Input, Button, CircularProgress, FormHelperText } from '@material-ui/core';
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
    form: {
      email: '',
    }
  };

  @action
  resetForm() {
    this.mState.loading = false;
    this.mState.form = {
      email: '',
    };
  }

  onSubmit = action(async (e: any) => {
    e.preventDefault();
    const { appState } = this.props;
    const { form } = this.mState;
    try {
      this.mState.loading = true;
      await appState.forgotPassword(form);
    } finally {
      this.resetForm();
      runInAction(() => this.mState.loading = false);
    }
  })

  onChangeEmail = action((e: React.ChangeEvent<HTMLInputElement>) => {
    this.mState.form.email = e.target.value;
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
                    <InputLabel htmlFor="email">Email</InputLabel>
                    <Input
                      id="email"
                      type="email"
                      value={this.mState.form.email}
                      onChange={this.onChangeEmail} />
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
                      Submit
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

export default withStyles(styles)(Register);
