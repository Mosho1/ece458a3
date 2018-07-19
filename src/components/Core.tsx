import * as   React from 'react';
import Link, { ButtonLink } from './Link';
import mobx from './mobx.png';
import { Theme, createStyles, AppBar, Toolbar, Typography, WithStyles, withStyles, Drawer, Divider, ListItem, ListItemIcon, ListItemText, List, Button, FormControl, InputLabel, Input, InputAdornment } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import { observer } from 'mobx-react';
import AppState from '../stores/AppState';
import { runInAction } from 'mobx';
import { grey } from '@material-ui/core/colors';

const drawerWidth = 240;

const styles = (theme: Theme) => createStyles({
  root: {
    flexGrow: 1,
  },
  appFrame: {
    zIndex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '100vh'
  },
  appBar: {
  },
  title: {
    whiteSpace: 'nowrap'
  },
  drawerPaper: {
    position: 'relative',
    width: drawerWidth,
  },
  toolbar: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing.unit * 3,
    overflowY: 'scroll'
  },
  flex: {
    flexGrow: 1
  },
  link: {
    display: 'block'
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.unit * 4,
    right: theme.spacing.unit * 4,
  },
  searchFormControl: {
    marginLeft: theme.spacing.unit * 4,
    marginRight: theme.spacing.unit * 4,
    padding: theme.spacing.unit / 2,
    background: `#ffffffa0`,
    borderRadius: '2px',
    width: '100%'
  },
  searchInput: {
  },
});

interface Props extends WithStyles<typeof styles> {
  appState: AppState;
}

@observer
class Core extends React.Component<Props> {

  logout = async () => {
    const { appState } = this.props;
    await appState.apiRequest('logout', {
      method: 'POST',
    });
    runInAction(() => {
      appState.resetState();
    });
    appState.goTo('/login');
  }

  onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.appState.setSearchTerm(e.target.value);
  };

  onSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.props.appState.searchForSites();
    }
  };

  get drawer() {
    const { classes } = this.props;
    return <Drawer
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left"
    >
      <div className={classes.toolbar} />
      <Divider />
      <List>
        <ListItem button>
          <ListItemText>
            <Link className={classes.link} href="/add">Add</Link>
          </ListItemText>
        </ListItem>
      </List>
    </Drawer>;
  }
  render() {
    const { appState, classes, children } = this.props;

    return <div className={classes.appFrame}>
      <AppBar
        position="absolute"
        className={classes.appBar}>
        <Toolbar>
          <Typography
            variant="title"
            color="inherit"
            className={`${classes.title} ${classes.flex}`}>
            {appState.loggedInAs && `Welcome, ${appState.loggedInAs}!`}
          </Typography>
          {appState.loggedInAs && <FormControl
            className={`${classes.flex} ${classes.searchFormControl}`}
          >
            <Input
              id="password"
              value={appState.searchTerm}
              placeholder="Enter site name"
              className={classes.searchInput}
              onChange={this.onSearch}
              onKeyPress={this.onSearchKeyPress}
              endAdornment={
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              }
            />
          </FormControl>}
          {appState.loggedInAs
            ? <Button onClick={this.logout} color="inherit">Logout</Button>
            : [
              <ButtonLink key="0" href="/login" color="inherit">Login</ButtonLink>,
              <ButtonLink key="1" href="/register" color="inherit">Register</ButtonLink>,
            ]}
        </Toolbar>
      </AppBar>
      {/* {this.drawer} */}
      <main className={classes.content}>
        <div className={classes.toolbar} />
        {children}
      </main>
      {appState.loggedInAs &&
        <ButtonLink href="/add" variant="fab" className={classes.fab} color="primary">
          <AddIcon />
        </ButtonLink>}
    </div>
  }
}

export default withStyles(styles)(Core);