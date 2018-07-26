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
    <ul className="pagination pagination-sm">
      {
        new Array(pages).fill(1).map((item, index) => {
          const key = index + 1;
          const onClick = key !== page ? () => changePage(key) : undefined;
          if ((key > page - 3 && key < page + 3) || (key === 1 || key === pages)) {
            return (
              <li className={`page-item ${key === page ? 'active' : ''}`} key={key}>
                <a className="page-link" href="javascript:void(0)" onClick={onClick}>{key}</a>
              </li>
            );
          } else if (key > page + 3 && key === pages - 1) {
            return (
              <li className={`page-item disabled`} key={key}>
                <a className="page-link" href="javascript:void(0)">...</a>
              </li>
            );
          } else if (key < page - 3 && key === 2) {
            return (
              <li className={`page-item disabled`} key={key}>
                <a className="page-link" href="javascript:void(0)">...</a>
              </li>
            );
          } else {
            return null;
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
