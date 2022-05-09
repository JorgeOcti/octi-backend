import * as React from 'react';
import { ErrorInfo } from 'react';
import { FieldArray, formValueSelector, InjectedFormProps, reduxForm } from 'redux-form';
import * as Raven from 'raven-js';
import TransmittalActions from '../../../actions/transmittal.actions';
import { connect } from 'react-redux';
import RequestImportRenderItem, { IRequestImportRenderItemProps } from './renders/RequestImportRenderRequest';
import { ISalesChannel } from '../../../../../../../src/request/interfaces/salesChannel.interface';
import { IOperationType } from '../../../../../../../src/request/interfaces/operationType.interface';
import { IReason } from '../../../../../../../src/request/interfaces/reason.interface';
import { IVenue } from '../../../../../../../src/app/interfaces/venue.interface';

interface IPropsType extends InjectedFormProps {
  channels: ISalesChannel[];
  operationTypes: IOperationType[];
  reasons: IReason[];
  venues: IVenue[];
}

interface IStateType {
  error: Error | null;
}

class Form extends React.Component<IPropsType, IStateType> {

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const { handleSubmit, channels, operationTypes, reasons, venues } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <FieldArray<IRequestImportRenderItemProps>
          name='requests'
          component={RequestImportRenderItem}
          props={{
            channels,
            operationTypes,
            reasons,
            venues
          }}
        />
      </form>
    );
  }
}

const RequestImportForm = reduxForm({
  form: 'requestImportForm'
})(Form);

const mapStateToProps = (state: { /*transmittal: ITransmittalState*/ }) => {
  const selector = formValueSelector('transmittalForm');
  return {
    // formValues: selector(state, 'carrier', 'driver', 'files', 'items'),
    // transmittal: state.transmittal
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const transmittalActions = new TransmittalActions(dispatch);
  return {
    dispatch,
    transmittalActions
  };
};

export default connect<{ /*transmittal: ITransmittalState*/ }, { dispatch: any }, any>(mapStateToProps, mapDispatchToProps)(RequestImportForm);
