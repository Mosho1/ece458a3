import * as React from 'react';
import AppState from '../stores/AppState';
import { observer } from 'mobx-react';

@observer
class Home extends React.Component<{ appState: AppState }, any> {

  render() {
    return (
      <div className="home">
        <h1>
          Welcome to the app!
        </h1>
      </div>
    );
  }
}

export default Home;
