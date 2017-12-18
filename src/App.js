import React, { Component } from 'react'

import { Route, Switch } from 'react-router'
import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import createStore from './store/store'

import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'

import StartingScreen from './components/StartingScreen/StartingScreen'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import ResultScreen from './components/ResultScreen/ResultScreen'

import './styles/index.css'

const store = createStore()

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div id="main">
          <Navbar />
          <BrowserRouter>
            <Switch>
              <Route exact path="/" component={StartingScreen} />
              <Route exact path="/loading" component={LoadingScreen} />
              <Route exact path="/result" component={ResultScreen} />
            </Switch>
          </BrowserRouter>
          <Footer />
        </div>
      </Provider>
    )
  }
}

export default App
