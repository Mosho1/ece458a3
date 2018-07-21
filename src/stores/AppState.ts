import { observable, action, runInAction, computed } from 'mobx';
import { Login } from '../components/Login';
import { Search } from '../components/Search';
import { Add } from '../components/Add';
import { encrypt, decrypt } from '../../webpack/crypto';

export interface Site {
  id: number,
  site: string;
  site_username: string;
  site_password: string;
}

/*
* This is the entry point for the app's state. All stores should go here.
*/
export class AppState {
  @observable loggedInAs: string | null = null;
  @observable masterKey: string | null = null;
  @observable searchTerm = '';
  @observable searchResults: Site[] | null = null;

  @action
  resetState() {
    this.loggedInAs = null;
    this.masterKey = null;
    this.searchResults = null;
  }

  setSearchTerm(value: string) {
    this.searchTerm = value;
  }

  @computed get encrypt() {
    return encrypt(this.masterKey);
  }

  @computed get decrypt() {
    return decrypt(this.masterKey);
  }

  onUnauthorized() {
    this.resetState();
    this.goTo('/login');
  }

  async searchForSites() {
    this.searchResults = null;
    this.goTo('/search');
    const res = await this.apiRequest(`/passwords/search?site=${this.searchTerm}`);
    const encryptedResults = await res.json() as Site[];
    this.searchResults = encryptedResults.map(x => ({
      id: x.id,
      site: x.site,
      site_username: this.decrypt(x.site_username),
      site_password: this.decrypt(x.site_password),
    }))
  }

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

    if (res.status === 401) {
      this.onUnauthorized();
    }

    if (res.status !== 200) {
      throw new Error(res.statusText);
    }

    return res;
  }

  async login(form: { username: string, password: string }) {
    const { username, password } = form;
    const res = await this.apiRequest('login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
      })
    });
    runInAction(() => {
      this.loggedInAs = username;
      this.masterKey = password;
    });
    this.goTo('/add');
  }

  async register(form: { username: string, email: string, password: string }) {
    await this.apiRequest('register', {
      method: 'POST',
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        password: form.password,
      })
    });
  }

  async forgotPassword(form: { email: string }) {
    await this.apiRequest('forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: form.email,
      })
    });
  }

  async changePassword(form: { password: string }) {
    const params = new URLSearchParams(location.search.slice(1));
    const token = params.get('token');
    if (!token) throw new Error('could not change password');
    await this.apiRequest('change-password', {
      method: 'POST',
      body: JSON.stringify({
        password: form.password,
        token
      })
    });
  }
  @observable confirmAccountStatus: 'start' | 'success' | 'failure' = 'start';

  async confirmAccount() {
    this.confirmAccountStatus = 'start';
    try {
      const params = new URLSearchParams(location.search.slice(1));
      const token = params.get('token');
      if (!token) throw new Error('could not confirm account');
      await this.apiRequest(`confirm`, {
        method: 'POST',
        body:JSON.stringify({
          token
        })
      });
      this.confirmAccountStatus = 'success';
    } catch (e) {
      console.error(e);
      this.confirmAccountStatus = 'failure';
    }
  }

  logout = async () => {
    try {
      await this.apiRequest('logout', {
        method: 'POST',
      });
    } finally {
      this.onUnauthorized();
    }
  }

  @action
  reload(store?: AppState) {
    if (store) {
      Object.assign(this, store);
    }
    return this;
  }

  unload() {

  }
}

export default AppState;