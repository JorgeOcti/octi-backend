import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { IInventoryState } from '../../actions/inventory.actions';
import ApiService from '../../utils/axios';
import TrackingBasePage from '../Utils/TrackingBasePage';
import RequestForm from './RequestForms/RequestForm';
import { AxiosError } from 'axios';
import * as swal from 'sweetalert';
import { getFormValues } from 'redux-form';


interface IPropsType extends RouteComponentProps<{}> {
  router: any;
}

interface IStateType {
  error: Error | null;
  created: boolean;
}

class RequestCreateIntegration extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  readonly api: ApiService;

  readonly state: IStateType = {
    error: null,
    created: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Crear solicitud';
    this.handleSubmit = this.handleSubmit.bind(this);
    this.api = new ApiService();
  }

  public componentDidMount(): void {
    super.componentDidMount();
    $('body')
      .removeClass('skin-purple')
      .css({ 'background-color':'#ecf0f5' });
  }

  public render(): React.ReactElement<IPropsType> {
    let { location: { query } } = this.props.router;
    query = Object.fromEntries(
      Object.entries<string>(query).map(([key, value]) =>
        // Modify key here
        [`${key}`, decodeURIComponent(value)]
      )
    );
    const {created} = this.state;
    return (
      <RequestForm
        onSubmit={this.handleSubmit}
        query={query}
        created={created}
        initialValues={{
          conectaID: query['6154722a94bba10012230aae'] || query['conectaID'],
          sellerText: query.sellerText,
          customerInformation:{
            rut: query.hasOwnProperty('5bf2de35caf8ef7096105c22')?query['5bf2de35caf8ef7096105c22']:'',
            name: query.hasOwnProperty('5bf2de35caf8ef7096105c21')?query['5bf2de35caf8ef7096105c21']:'',
            email: query.hasOwnProperty('60b9232164adc90013a79b45')?query['60b9232164adc90013a79b45']:'',
          },
          advancePaymentInformation: {
            method: '',
            number: '',
            files: []
          },
          cars: []
        }}
      />
    );
  }

  private handleSubmit(values: any) {
    this.api
      .createRequest({
        cars: values.cars,
        channel: values.channel,
        operationType: values.operationType,
        venue: values.venue,
        sellerText: values.sellerText,
        advancePaymentInformation: values.advancePaymentInformation,
        customerInformation: values.customerInformation,
        deliveryVenue: values.deliveryVenue,
        deliveryAddress: values.deliveryAddress,
        deliveryDate: values.deliveryDate,
        conectaID: values.conectaID,
      })
      .then((response) => {
        const {data} = response.data;
        this.setState({
          created: true
        });
        swal!('Orden creada!', `La orden ha sido creada satisfactoriamente con el Nº${data.number}!`, 'success', {
          button: false,
          closeOnClickOutside: false,
          closeOnEsc: false,
        });
        window.scrollTo(0, 0);
      })
      .catch((err: AxiosError): void => {
        this.api.errorHandler(err);
      });
  }
}

const mapStateToProps = (state: { inventories: IInventoryState, router: any }) => {
  return {
    inventories: state.inventories,
    router: state.router
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};


export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(RequestCreateIntegration);
