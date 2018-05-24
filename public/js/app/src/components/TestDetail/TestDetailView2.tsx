import * as React from 'react';
import AppContainer from "../../container/AppContainer";

class TestDetailView2 extends React.Component {

  componentWillMount(){
    document.title = 'OSA Andes | test 2'
  }

  render() {
    return (
      <AppContainer title='welcome osa' cMenu='2' cSubMenu='2.2' cAction='List'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Title</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">
              <h3>¿Qué es Lorem Ipsum?</h3>
              <p><strong>Lorem Ipsum</strong> es simplemente el texto de relleno de las imprentas y archivos de texto. Lorem Ipsum ha sido el texto
                de relleno estándar de las industrias desde el año 1500, cuando un impresor (N. del T. persona que se dedica a la imprenta)
                desconocido usó una galería de textos y los mezcló de tal manera que logró hacer un libro de textos especimen. No sólo sobrevivió
                500 años, sino que tambien ingresó como texto de relleno en documentos electrónicos, quedando esencialmente igual al original. Fue
                popularizado en los 60s con la creación de las hojas "Letraset", las cuales contenian pasajes de Lorem Ipsum, y más recientemente
                con software de autoedición, como por ejemplo Aldus PageMaker, el cual incluye versiones de Lorem Ipsum.</p>
            </div>
            <div className="box-footer">Footer</div>
          </div>
        </section>
      </AppContainer>
    );
  }
}

export default TestDetailView2;
