import * as PropTypes from 'prop-types';
import * as React from 'react';
interface IPropsType {
  page: number;
  pages: number;
  changePage: (page: number) => void;
}
const Paginator: React.StatelessComponent<IPropsType> = (props) => {
  const {page, pages, changePage} = props;
  return (
    <ul className="pagination">
      {
        new Array(pages).fill(1).map((item, index) => {
          const idPagination = index + 1;
          const onClick = idPagination !== page ? () => changePage(idPagination) : () => {};
          // if((idPagination > page - 3 && idPagination < page + 3)  || (idPagination !== 1 || idPagination !== pages)) {
          if((idPagination > page - 3 && idPagination < page + 3)  || (idPagination === 1 || idPagination === pages)) {
            return (
              <li className={`page-item ${idPagination === page ? 'active' : ''}`} key={idPagination}>
                <a className="page-link" href="javascript:void(0)" onClick={onClick}>{idPagination}</a>
              </li>
            )
          } else if (idPagination > page + 3 && idPagination === pages - 1) {
            return (
                <li className={`page-item disabled`} key={idPagination}>
                  <a className="page-link" href="javascript:void(0)">...</a>
                </li>
              )
          }else if (idPagination < page - 3 && idPagination === 2) {
            return (
                <li className={`page-item disabled`} key={idPagination}>
                  <a className="page-link" href="javascript:void(0)">...</a>
                </li>
              )
          } else {
            return null
          }
        })
      }
    </ul>
  );
};

Paginator.propTypes = {
  page: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  changePage: PropTypes.func.isRequired
};

export default Paginator;
