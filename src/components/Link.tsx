import * as React from 'react';
import Button, { ButtonProps } from '@material-ui/core/Button';

export const pushState = (url: string) => (e: React.MouseEvent<any>) => {
  e.preventDefault();
  history.pushState(null, "", url);
}

const Link = ({ href, ...rest }: React.AllHTMLAttributes<any>) =>
  <a
    href={href}
    style={{
      textDecoration: 'none',
    }}
    onClick={pushState(href)} {...rest}
  />;

export const ButtonLink = ({ href, ...rest }: ButtonProps) =>
  <Button href={href} onClick={pushState(href)} {...rest} />;

export default Link;