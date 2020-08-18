import { createGlobalStyle } from 'styled-components';

import backgroundImage from '../../images/body-bg.jpg';

export const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Open Sans', sans-serif;
    background: url(${backgroundImage}) top center no-repeat fixed #f5f5f5;
    background-size: 100% auto;
  }

  h1, h2, h3, h4, h5, h6, p {
    margin: 0;
  }

  h3 {
    font-size: 1.2rem;
  }

  h4 {
    font-size: 1.1rem;
    margin-bottom: 4px;
  }

  h5 {
    font-size: 0.7rem;
  }

  p, th, td {
    font-size: 0.8rem;
  }

  .btn {
    font-size: 0.9rem;
  }

  
  .card {
    margin-bottom: 8px;
    background-color: #fff;
    border: 1px solid transparent;
    border-radius: 4px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  }

  .card-body {
    padding: 8px 4px 8px 8px;
  }

  .card section:not(:first-child) {
    margin-top: 16px;
  }

   /* Header */

  .header .card-body {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 0px;
  }

  .header h3 {
    flex: 2;
  }

  .header button+h3 {
    margin-left: 8px;
  }

  .header .card-body .item:not(:first-child) {
    padding-left: 8px;
  }

  .header .card-body .text {
    flex: 2;
  }

  .content {
    flex-basis: 100%;
    display: flex;
  }

  .content .sidebar,
  .content .sidebar2 {
    width: 240px;
    flex: 0 0 auto;
  }

  .content .sidebar {
    margin-right: 8px;
  }

  .content .sidebar2 {
    margin-left: 8px;
  }

  .sidebar2 .card-body {
    margin-bottom: 16px;
  }

  .content .parameters,
  .content .results {
    flex: 1 auto;
  }

  .content .result {
     margin-top: 1rem;
  }
`;
