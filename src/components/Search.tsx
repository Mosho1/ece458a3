import * as React from 'react';
import { observer } from 'mobx-react';
import AppState, { Site } from '../stores/AppState';
import Link from './Link';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { Grid, Paper, Theme, WithStyles, FormControl, InputLabel, Input, Button, CircularProgress, TableCell, TableRow, TableHead, Table, TableBody, IconButton, Tooltip } from '@material-ui/core';
import { action, observable, runInAction } from 'mobx';
import { green } from '@material-ui/core/colors';
import Visibility from '@material-ui/icons/Visibility';
import ContentCopy from '@material-ui/icons/ContentCopy';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

const rowStyles = (theme: Theme) => createStyles({
  passwordText: {
    flexGrow: 1,
  },
  iconButton: {
    height: 32,
    width: 32,
    fontSize: '20px!important',
    marginLeft: theme.spacing.unit / 2,
    position: 'relative'
  },
  tooltip: {
    background: theme.palette.common.white,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[1],
    fontSize: 11,
  },
});

interface RowProps extends WithStyles<typeof rowStyles> {
  site: Site
}

@observer
class SearchRowBase extends React.Component<RowProps> {

  @observable mState = {
    showPassword: false,
    copied: false
  };

  handleClickShowPassword = () => {
    this.mState.showPassword = !this.mState.showPassword;
  };

  copyToClipboard = () => {
    const el = document.createElement('textarea');
    el.value = this.props.site.site_password;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.mState.copied = true;
    setTimeout(() => this.mState.copied = false, 1200);
  };

  render() {
    const { site, classes } = this.props;
    const { showPassword } = this.mState;
    return <TableRow>
      <TableCell component="th" scope="row">
        {site.site}
      </TableCell>
      <TableCell>{site.site_username}</TableCell>
      <TableCell>
        <span className={classes.passwordText}>{showPassword ? site.site_password : '••••••'}</span>
        <IconButton
          aria-label="Toggle password visibility"
          className={classes.iconButton}
          onClick={this.handleClickShowPassword}
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>

        <Tooltip
          PopperProps={{
            disablePortal: true,
          }}
          classes={{
            tooltip: classes.tooltip,
          }}
          open={this.mState.copied}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          placement="right"
          title="Copied to clipboard"
        >
          <IconButton
            aria-label="Copy to clipboard"
            className={classes.iconButton}
            onClick={this.copyToClipboard}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>;
  }
}

const SearchRow = withStyles(rowStyles)(SearchRowBase);

const styles = (theme: Theme) => createStyles({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
    overflowX: 'auto',
  },
  table: {
    position: 'relative',
    minWidth: 700,
    minHeight: 150
  },
  loading: {
    color: green[500],
    position: 'absolute',
    top: 'calc(50% + 56px/2)',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  noResults: {
    textAlign: 'center'
  }
});

interface Props extends WithStyles<typeof styles> {
  appState: AppState;
  context: 'login' | 'register'
}

@observer
export class Search extends React.Component<Props, any> {

  constructor(props: Props) {
    super(props);
    if (props.appState.search) {
      this.mState = props.appState.search.mState;
    }
    runInAction(() => {
      props.appState.search = this;
    });
  }

  get tableBody() {
    const { classes, appState } = this.props;
    const { searchResults } = appState;
    if (searchResults === null) {
      return <TableBody>
        <TableRow>
          <TableCell colSpan={3}>
            <CircularProgress
              size={24}
              className={classes.loading}
            />
          </TableCell>
        </TableRow>
      </TableBody>
    }

    if (searchResults.length === 0) {
      return <TableBody>
        <TableRow>
          <TableCell className={classes.noResults} colSpan={3}>
            No Results
        </TableCell>
        </TableRow>
      </TableBody>;
    }

    return <TableBody>
      {appState.searchResults.map(n =>
        <SearchRow key={n.id} site={n} />
      )}
    </TableBody>;
  }

  render() {
    const { appState, classes } = this.props;
    return (
      <Grid justify="center" container spacing={24}>
        <Grid item>
          <Paper className={classes.root}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell>Site</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Password</TableCell>
                </TableRow>
              </TableHead>
              {this.tableBody}
            </Table>
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(Search);
