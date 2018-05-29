import * as React from 'react';
import AppContainer from "../../container/AppContainer";

class UsersListView extends React.Component {

  componentWillMount(){
    document.title = 'OSA Andes | Listado de usuarios'
  }

  render() {
    return (
      <AppContainer title='' cMenu='2' cSubMenu='2.1' cAction='Listado'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Usuarios</h3>
              <div className="box-tools pull-right">
                <button className="btn btn-sm btn-success">Agregar</button>
              </div>
            </div>
            <div className="box-body">
              <div className="pull-right">
                <div className="input-group text-right" style={{maxWidth: '300px'}}>
                  <input type="text" className="form-control" placeholder="Buscar"/>
                  <span className="input-group-addon" style={{backgroundColor:'#337ab7', color:'#FFF', borderColor:'#337ab7'}}><i className="fa fa-search" /></span>
                </div>
              </div>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Firstname</th>
                    <th>Lastname</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>John</td>
                    <td>Doe</td>
                    <td>john@example.com</td>
                  </tr>
                  <tr>
                    <td>Mary</td>
                    <td>Moe</td>
                    <td>mary@example.com</td>
                  </tr>
                  <tr>
                    <td>July</td>
                    <td>Dooley</td>
                    <td>july@example.com</td>
                  </tr>
                  <tr>
                    <td>July</td>
                    <td>Dooley</td>
                    <td>july@example.com</td>
                  </tr>
                  <tr>
                    <td>July</td>
                    <td>Dooley</td>
                    <td>july@example.com</td>
                  </tr>
                  <tr>
                    <td>July</td>
                    <td>Dooley</td>
                    <td>july@example.com</td>
                  </tr>
                  <tr>
                    <td>July</td>
                    <td>Dooley</td>
                    <td>july@example.com</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="box-footer text-right">
              <nav aria-label="...">
                <ul className="pagination">
                  <li className="page-item disabled">
                    <a className="page-link" href="#">Previous</a>
                  </li>
                  <li className="page-item"><a className="page-link" href="#">1</a></li>
                  <li className="page-item active">
                    <a className="page-link" href="#">2 <span className="sr-only">(current)</span></a>
                  </li>
                  <li className="page-item"><a className="page-link" href="#">3</a></li>
                  <li className="page-item">
                    <a className="page-link" href="#">Next</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </section>
      </AppContainer>
    );
  }
}

export default UsersListView;
