import TrackingBasePage from "./TrackingBasePage";
import * as React from "react";

export enum Actions {
  edit = 'edit',
  delete = 'delete',
}

export interface IHeaderAccessor {
  name: string,
  accessor:(datum: any) => string,
}

export interface IPropsType {
  headers: IHeaderAccessor[];
  actions: Actions[];
  data: {name: string}[];
  name: string;
  editElement? : (value: any) => void;
  deleteElement? : (value: any) => void;
}

export default class TableListView extends TrackingBasePage<IPropsType, any> {
  title: string

  constructor(props: IPropsType) {
    super(props);
    this.title = `${props.name.toUpperCase()}`
  }


  public render() : React.ReactElement<IPropsType> {
    const {headers, actions, data, name, editElement, deleteElement} = this.props;
    let columnWidth = 95/headers.length;

    let editElementWrapper = editElement ?? (value => {return;});
    let deleteElementWrapper = deleteElement ?? (value => {return;});

    return <div className='box-body no-padding'>
      <table className='table table-andes table-striped'>
        <thead>
        <tr>
          {headers.map(h =>
            <th key={h.name} style={{ width: `${columnWidth}%` }} className='middle'>{h.name}</th>
          )}
          {
            actions.includes(Actions.edit) ?
              <th style={{ width: '1%' }} className='width-10' /> : null
          }
          {
            actions.includes(Actions.delete) ?
              <th style={{ width: '1%' }} className='width-10' /> : null
          }
        </tr>
        </thead>
        <tbody>
        {
          data.map((value: any) => {
            let cols = headers.map(h =>
              <td
                id={`${name}-${h.name}-`}
                key={`${name}-${h.name}`}
                className='middle'>
                  <strong className='text-primary'>
                    {h.accessor(value)?.toUpperCase()}
                  </strong>
              </td>
            );
            return <tr
              key={value._id}
              id={`${name}-${value._id}`}
              className={'background-transition'}
            >{cols}{
                actions.includes(Actions.edit) ?
                  <td
                    className='middle text-blue pointer'
                    onClick={() => editElementWrapper(value)}>
                    <i className='fa fa-pencil' />
                  </td> : null
              }{
                actions.includes(Actions.delete) ?
                  <td
                    className='middle text-red pointer'
                    onClick={() => deleteElementWrapper(value)}
                  >
                    <i className='fa fa-minus-circle' />
                  </td> : null
              }</tr>;
          })
        }
        </tbody>
      </table>
    </div>;
  }
}
