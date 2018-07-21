import * as React from 'react';
import { observer } from 'mobx-react';
import AppState from '../stores/AppState';
import Link from './Link';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { Grid, Paper, Theme, WithStyles, FormControl, InputLabel, Input, Button, CircularProgress, Typography } from '@material-ui/core';
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
  onSubmit: Function;
  onSuccess?: Function;
  onError?: Function;
  afterSubmit?: Function;
  buttonText?: string;
  successMessage?: string;
  errorMessage?: string;
}

@observer
export class Login extends React.Component<Props, any> {

  static defaultProps: Partial<Props> = {
    buttonText: 'Submit',
    afterSubmit: () => null,
    onSuccess: () => null,
    onError: () => null,
  };

  componentDidMount() {
    this.resetForm();
  }

  @observable mState = {
    loading: false,
    error: false,
    success: false
  };

  @action
  resetForm() {
    this.mState.loading = false;
  }

  onSubmit = action(async (e: any) => {
    e.preventDefault();
    try {
      this.mState.loading = true;
      this.mState.error = false;
      this.mState.success = false;

      await this.props.onSubmit(e);

      this.mState.success = true;
      this.props.onSuccess();
    } catch(e) {
      console.error(e);
      this.mState.error = true;
      this.props.onError();
    } finally {
      this.props.afterSubmit();
      this.resetForm();
      runInAction(() => this.mState.loading = false);
    }
  })

  render() {
    const { appState, classes, children, buttonText, successMessage, errorMessage } = this.props;
    return (
      <form onSubmit={this.onSubmit} className={classes.form}>
        {children}
        <Grid item xs={12}>
          <FormControl className={classes.formControl}>
            <Button
              disabled={this.mState.loading}
              variant="contained"
              type="submit"
              color="primary"
              className={classes.button}>
              {buttonText}
                    </Button>
            {this.mState.loading &&
              <CircularProgress
                size={24}
                className={classes.buttonProgress}
              />}
          </FormControl>
        </Grid>
      </form>
    );
  }
}

export default withStyles(styles)(Login);
