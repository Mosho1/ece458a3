import * as React from 'react';
import AppState from './stores/AppState';
import App from './App';
import Core from './components/Core';
import { observer } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import CssBaseline from '@material-ui/core/CssBaseline';

interface Props { app: App }

@observer
class Root extends React.Component<Props, {}> {

  render() {
    const { routeComponent, appState } = this.props.app;
    return (
      <div>
        <CssBaseline />
        <Core appState={appState} children={routeComponent} />
      </div>
    );
  }
}

export default Root;
