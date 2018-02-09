import PropTypes from 'prop-types';
import React, { Component } from 'react'
import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Grid, Segment, Dimmer, Loader, Button, Checkbox, Form, Input, Radio, Select, TextArea, Message, Modal, Header, Icon, Visibility, TransitionablePortal } from 'semantic-ui-react'
// import { withApollo } from 'react-apollo';
import { getRouteFormState } from '../../graphql/routeForm'
import { createRouteMutation, updateRouteMutation } from '../../graphql/routeForm'

class RouteForm extends Component {

  static propTypes = {
    feedData: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      ...this.props.localState, 
  
      // !!! mappings specific to the dropdowns, should be done here in this form (or in some sematicUI type class)
      allDrivers: this.props.feedData['activeDrivers'],
      allPassengers: this.props.feedData['activePassengers'],
      allLocations: this.props.feedData['locations'],

      newLocation: '',  // should manage this type of change state in apollo?
      newDriver: '',
      newPassengers: '',

    };
  }

  render() {
    // const {currentLocation} = this.state
    const { startsAt, endsAt, currentDriver, currentPassengers, currentLocation } = this.state
    const { allLocations, allPassengers, allDrivers } = this.state
    const loading = (this.props.createRouteMutation.loading || this.props.updateRouteMutation.loading);

    return (
      <Modal
        open={true}
        onClose={this.handleClose}
        dimmer='inverted'
        size='large'
      >
        <Header icon='users' content='Route Assignments:' />
        <Modal.Content>
          { loading ?
            <Dimmer enabled inverted>
              <Loader inverted content='Saving' />
            </Dimmer> : null
          }
          <p>Assign the pickup location, driver, and passengers</p>
          <Form size='large'>
            <Form.Group>
              <Form.Field upward control={Select}
                label='Location'
                name='currentLocation'
                placeholder='Select Location'
                defaultValue={currentLocation}
                options={allLocations}
                onChange={this.handleChange}
              />
              <Form.Field control={Select} label='Driver' upward name='currentDriver' defaultValue={currentDriver} options={allDrivers} placeholder='Select Driver' onChange={this.handleChange} />
              <Form.Field control={Select} multiple upward label='Passengers' name='currentPassengers' defaultValue={currentPassengers} options={allPassengers} placeholder='Select Passengers' onChange={this.handleChange} />
            </Form.Group>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button color='red' onClick={this.handleClose} inverted>
            <Icon name='cancel' /> Cancel
           </Button>
          <Button color='green' onClick={this.handleSubmit} inverted>
            <Icon name='checkmark' /> Save
           </Button>
        </Modal.Actions>
      </Modal>

    )
  }

  handleClose = () => this.props.showRouteForm(false)

  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  handleSubmit = () => {
    const { routeId, startsAt, endsAt, currentDriver, currentPassengers, currentLocation } = this.state
    var top = this;
    this.setState({ newDriver: currentDriver, newPassengers: currentPassengers, newLocation: currentLocation })

    var routeMutationParams = {
      id: routeId,
      startsAt: startsAt,
      endsAt: endsAt,
      location: currentLocation ? currentLocation.toString() : null,
      driver: currentDriver ? currentDriver.toString() : null,
      passengers: currentPassengers ? JSON.stringify(currentPassengers) : null,
    };

    if (top.state.crudType == "update") {
      updateRoute(top, routeMutationParams);
    }
    else {
      createRoute(top, routeMutationParams);
    }
  }

}

// ________________________________ Apollo Calls ____________________________________________

function createRoute(top, routeMutationParams) {

  top.props.createRouteMutation({
    variables: routeMutationParams
  })
    .then(({ data }) => {
      var newFcRoute = JSON.parse(data.createRouteMutation);
      top.props.showRouteForm(false);
      top.props.addNewEventToFullcalendar(newFcRoute);
      // lastWorkingDate

      // # cookies.permanent[:last_working_date] = @route.starts_at.iso8601
      // # session[:last_route_id_edited] = @route.id # used to plant a Class to mark the event in the calendar, so the js can highlight the change and scroll to it.
    }).catch((error) => {
      console.log('there was an error sending the query', error);
    });
};

function updateRoute(top, routeMutationParams) {

  top.props.updateRouteMutation({
    variables: routeMutationParams
  })
    .then(({ data }) => {
      var updatedFcRoute = JSON.parse(data.updateRouteMutation);
      top.props.showRouteForm(false);
      top.props.updateEventInFullcalendar(updatedFcRoute);
      // lastWorkingDate

      // # cookies.permanent[:last_working_date] = @route.starts_at.iso8601
      // # session[:last_route_id_edited] = @route.id # used to plant a Class to mark the event in the calendar, so the js can highlight the change and scroll to it.
    }).catch((error) => {
      console.log('there was an error sending the query', error);
    });
};

// ________________________________ Compose ____________________________________________

export default compose(
  graphql(createRouteMutation, { name: 'createRouteMutation', }),
  graphql(updateRouteMutation, { name: 'updateRouteMutation', }),
  graphql(getRouteFormState, { name: 'getRouteFormState', }),

)(RouteForm);

  // https://www.apollographql.com/docs/react/basics/setup.html#graphql