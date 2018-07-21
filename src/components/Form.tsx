import * as React from 'react';
import { observer } from 'mobx-react';
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
    marginBottom: theme.spacing.unit,
  },
  formControl: {
    margin: theme.spacing.unit,
  },
  button: {
    margin: theme.spacing.unit * 2,
    marginBottom: 0
  },
  buttonProgress: {
    color: green[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -12,
  },
});

interface Props extends WithStyles<typeof styles> {
  onSubmit: Function;
  onSuccess?: Function;
  onError?: Function;
  afterSubmit?: Function;
  buttonText?: string;
  successMessage?: string | JSX.Element | JSX.Element[];
  errorMessage?: string | JSX.Element | JSX.Element[];
}

@observer
export class Form extends React.Component<Props, any> {

  static defaultProps: Partial<Props> = {
    buttonText: 'Submit',
    errorMessage: 'Something went wrong!',
    successMessage: 'Submitted successfully',
    afterSubmit: () => null,
    onSuccess: () => null,
    onError: () => null,
  };

  componentDidMount() {
    this.resetForm();
  }

  @observable mState = {
    status: null as null | 'start' | 'success' | 'error',
  };

  @action
  resetForm() {
    this.mState.status = null;
  }


  onSubmit = action(async (e: any) => {
    e.preventDefault();
    try {
      this.mState.status = 'start';
      await this.props.onSubmit(e);
      this.mState.status = 'success';
      this.props.onSuccess();
    } catch (e) {
      console.error(e);
      this.mState.status = 'error';
      this.props.onError();
    } finally {
      this.props.afterSubmit();
    }
  })

  get successMessage() {
    const { successMessage } = this.props;
    const { status } = this.mState;
    if (!successMessage) return null;
    if (status !== 'success') return null;
    if (typeof successMessage !== 'string') return successMessage;
    return <Typography>{successMessage}</Typography>;
  }

  get errorMessage() {
    const { errorMessage } = this.props;
    const { status } = this.mState;
    if (!errorMessage) return null;
    if (status !== 'error') return null;
    if (typeof errorMessage !== 'string') return errorMessage;
    return <Typography color="error">{errorMessage}</Typography>;
  }

  render() {
    const { classes, children, buttonText } = this.props;
    const { status } = this.mState;
    return (
      <form onSubmit={this.onSubmit} className={classes.form}>
        {children}
        <Grid item xs={12}>
          <FormControl className={classes.formControl}>
            <Button
              disabled={status === 'start'}
              variant="contained"
              type="submit"
              color="primary"
              className={classes.button}>
              {buttonText}
            </Button>
            {status === 'start' &&
              <CircularProgress
                size={24}
                className={classes.buttonProgress}
              />}
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          {this.successMessage}
          {this.errorMessage}
        </Grid>
      </form>
    );
  }
}

export default withStyles(styles)(Form);
