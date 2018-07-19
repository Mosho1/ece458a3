import { observable, action, runInAction } from 'mobx';
import { Login } from '../components/Login';
import { Search } from '../components/Search';
import { Add } from '../components/Add';

const hasWindow = typeof window !== 'undefined';

/*
* This is the entry point for the app's state. All stores should go here.
*/
export class AppState {
  @observable login: Login = null;
  @observable search: Search = null;
  @observable add: Add = null;
  @observable loggedInAs: string | null = null;


  async refreshToken() {
    try {
      const res = await this.apiRequest('refresh', {
        method: 'POST'
      });

      const user = await res.json();

      runInAction(() => {
        this.loggedInAs = user.username;
      });
    } catch (e) {
      console.error(e);
    }
  }

  goTo = (url: string, replace = false) =>
    replace
      ? history.replaceState(null, "", url)
      : history.pushState(null, "", url)

  apiRequest = async (path: string, init?: RequestInit) => {
    const res = await fetch(`/api/${path.replace(/^\//, '')}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      ...init,
    });

    if (res.status !== 200) {
      throw new Error(res.statusText);
    }

    return res;
  }

  @action
  reload(store?: AppState) {
    if (store) {
      this.login = store.login;
      this.search = store.search;
      this.add = store.add;
      this.loggedInAs = store.loggedInAs;
    }
    return this;
  }

  unload() {

  }
}

export default AppState;