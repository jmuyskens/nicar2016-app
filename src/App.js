import React, { Component } from 'react';
import { NICE, SUPER_NICE } from './colors';
import nicar from '../nicar.json';
import _ from 'lodash';
import localforage from 'localforage';
import update from 'react-addons-update';
import classNames from 'classnames';
import moment from 'moment';
import StickyFill from 'stickyfill';
import stickyPosition from 'sticky-position';


let stickyfill = StickyFill()

const days = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

class Time extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let date = moment(this.props.children)
    return (
      <span className="time">{date.format('h:mm a')}</span>
      )
  }
}

class Session extends Component {
  constructor(props) {
    super(props);
  }

  handleSelect() {
    this.props.handleSelect(this.props.data.url, !this.props.data.selected)
  }

  render() {
    var classes = classNames('session', {'selected': this.props.data.selected})

    let button = (<button onClick={ () => this.handleSelect() }>Add to schedule</button>)
    if (this.props.data.selected)
      button = (<button onClick={() => this.handleSelect() }>Remove from schedule</button>)

    return (
      <div className={classes}>
        <h3><a href={this.props.data.url}>{this.props.data.title}</a></h3>
        <div className="info">
          <Time>{this.props.data.start_time}</Time> - <Time>{this.props.data.end_time}</Time> • {this.props.data.room} • {this.props.data.category}
        </div>
        <p>
          <b>Speakers: </b>
          {this.props.data.speaker}
        </p>
        <p className="body">
          {this.props.data.description}
        </p>
        {button}
      </div>
    )
  }
}

class TimeSlot extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className="timeslot">
        {this.props.sessions}
      </div>
    )
  }

}

class Day extends Component {
  constructor(props) {
    super(props)
  }


  componentDidMount() {
    this.sticky = stickyPosition({
      primary: this.refs.primary,
      placeholder: this.refs.placeholder,
      wrapper: this.refs.wrapper,
      computeWidth: this.props.computeWidth,
    })
  }

  componentWillUnmount() {
    this.sticky.destroy();
  }

  render() {
    let timeSlots = _(this.props.values)
      .sortBy('props.data.start_time')
      .groupBy('props.data.start_time')
      .toPairs()
      .map((time, i) => (<TimeSlot key={i} sessions={time[1]} />))
      .value()
    console.log(timeSlots)
    return (
      <div className="day">
        <div ref="header" className="header sticky">
          <h2>{days[this.props.title]}</h2>
        </div>
        {timeSlots}
      </div>
    )
  }
}

class Group extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    console.log(this.props)
    let days = _(this.props.children)
      .groupBy('props.data.day')
      .toPairs()
      .map((day, i) => (<Day key={i} title={day[0]} values={day[1]} />))
      //.map((day, i) => new Day({key: i, title: day[0], values: day[1]}))
      .value()

    console.log(days)

    return (
      <div className="group">
        {days}
      </div>
    )

  }
}

class Schedule extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sessions: [],
      showAllSessions: true
    }
  }

  componentDidUpdate() {
    //stickyfill.rebuild()
  }

  componentDidMount() {
    let self = this
    localforage.getItem('nicarSchedule', function(err, value) {
      if (err) {
        console.log('oh no', err);
      } else {
        let sessions = nicar;
        if (value) {
          console.log(value);
          let sessions = nicar.map(function(d) {
            d.selected = value[d.url];
            return d;
          });
        } else {
          localforage.setItem('nicarSchedule', {});
        }
        self.setState({'sessions': sessions})
      }
    })
  }

  selectSession(self, index) {
    return function(url, isSelected) {
      console.log(url, index, isSelected);
      self.setState({
        sessions: update(self.state.sessions, {
          [index]: {
            selected: {$set: isSelected}
          }
        })
      })
      localforage.getItem('nicarSchedule', function(err, value) {
        if (value) {
          value[url] = isSelected
          localforage.setItem('nicarSchedule', value);
        }
      })
    }
  }

  componentWillUnmount() {

  }



  render() {

    let toggleSessions = () => {
      this.setState({showAllSessions: !this.state.showAllSessions})
    }

    let sessionToggle = (<button onClick={toggleSessions}>Show my sessions</button>);
    if (!this.state.showAllSessions) {
      sessionToggle = (<button onClick={toggleSessions}>Show all sessions</button>)
    }

    return (
      <div className="schedule">
        <header>
          <h1>nicar 2016</h1>
          {sessionToggle}
        </header>
        <Group>
        {this.state.sessions
          .filter((data) => this.state.showAllSessions || data.selected)
          .map((data, i) => (<Session key={i} handleSelect={ this.selectSession(this, i) } data={data} />))}
        </Group>
      </div>
    )
  }
}


export class App extends Component {
  render() {
    return (
      <Schedule />
    );
  }
}
