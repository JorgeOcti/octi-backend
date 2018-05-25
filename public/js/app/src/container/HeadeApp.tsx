// import * as PropTypes from 'prop-types';
import * as React from 'react';
import {IWindow} from "../interfaces/window";

declare let window: IWindow;

const HeaderApp: React.StatelessComponent<{}> = () => {
  return (
    <header className="main-header">
      <a className="logo" href="/">
        <span className="logo-mini"><b>A</b>LT</span>
        <span className="logo-lg"><b>OSA</b>Andes</span>
      </a>
      <nav className="navbar navbar-static-top">
        <a className="sidebar-toggle hidden-md hidden-lg" href="#" data-toggle="push-menu" role="button">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar" />
          <span className="icon-bar" />
          <span className="icon-bar" />
        </a>
        <div className="navbar-custom-menu">
          <ul className="nav navbar-nav">
            {/*<li className="dropdown messages-menu">*/}
              {/*<a className="dropdown-toggle" href="#" data-toggle="dropdown">*/}
                {/*<i className="fa fa-envelope-o" />*/}
                {/*<span className="label label-success">4</span>*/}
              {/*</a>*/}
              {/*<ul className="dropdown-menu">*/}
                {/*<li className="header">You have 4 messages</li>*/}
                {/*<li>*/}
                  {/*<ul className="menu">*/}
                    {/*<li><a href="#">*/}
                      {/*<div className="pull-left">*/}
                        {/*<img className="img-circle" src="/static/theme/dist/img/user2-160x160.jpg" alt="User Image" />*/}
                      {/*</div>*/}
                      {/*<h4>Support Team*/}
                        {/*<small><i className="fa fa-clock-o" /> 5 mins</small>*/}
                      {/*</h4>*/}
                      {/*<p>Why not buy a new awesome theme?</p></a></li>*/}
                  {/*</ul>*/}
                {/*</li>*/}
                {/*<li className="footer"><a href="#">See All Messages</a></li>*/}
              {/*</ul>*/}
            {/*</li>*/}
            {/*<li className="dropdown notifications-menu">*/}
              {/*<a className="dropdown-toggle" href="#" data-toggle="dropdown">*/}
                {/*<i className="fa fa-bell-o" />*/}
                {/*<span className="label label-warning">10</span>*/}
              {/*</a>*/}
              {/*<ul className="dropdown-menu">*/}
                {/*<li className="header">You have 10 notifications</li>*/}
                {/*<li>*/}
                  {/*<ul className="menu">*/}
                    {/*<li><a href="#"><i className="fa fa-users text-aqua" /> 5 new members joined today</a></li>*/}
                  {/*</ul>*/}
                {/*</li>*/}
                {/*<li className="footer"><a href="#">View all</a></li>*/}
              {/*</ul>*/}
            {/*</li>*/}
            <li className="dropdown user user-menu">
              <a className="dropdown-toggle" href="#" data-toggle="dropdown">
                <img className="user-image" src="/static/theme/dist/img/user2-160x160.jpg" alt="User Image" />
                <span className="hidden-xs">{`${window.user.name || ''} ${window.user.lastName || ''}${!window.user.name && ! window.user.lastName?'Unknown User':''}`}</span>
              </a>
              <ul className="dropdown-menu">
                <li className="user-header">
                  <img className="img-circle" src="/static/theme/dist/img/user2-160x160.jpg" alt="User Image" />
                  <p>{`${window.user.name || ''} ${window.user.lastName || ''}${!window.user.name && ! window.user.lastName?'Unknown User':''}`}
                    <small>Member since Nov. 2012</small>
                  </p>
                </li>
                {/*<li className="user-body">*/}
                  {/*<div className="row">*/}
                    {/*<div className="col-xs-4 text-center"><a href="#">Followers</a></div>*/}
                    {/*<div className="col-xs-4 text-center"><a href="#">Sales</a></div>*/}
                    {/*<div className="col-xs-4 text-center"><a href="#">Friends</a></div>*/}
                  {/*</div>*/}
                {/*</li>*/}
                <li className="user-footer">
                  {/*<div className="pull-left"><a className="btn btn-default btn-flat" href="#">Profile</a></div>*/}
                  <div className="pull-right"><a className="btn btn-default btn-flat" href="/account/logout/">Sign out</a></div>
                </li>
              </ul>
            </li>
            {/*<li><a href="#" data-toggle="control-sidebar"><i className="fa fa-gears"></i></a></li>*/}
          </ul>
        </div>
      </nav>
    </header>
  );
};

HeaderApp.propTypes = {
};

export default HeaderApp;


