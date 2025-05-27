// components/PageStateHandler.js
import React from 'react';
import ModalCarregando from './ModalCarregando';

const PageStateHandler = ({ loading, error, children }) => {
    if (loading) return <ModalCarregando show={true} />;
    if (error) return <div className="alert alert-danger">Erro: {error}</div>;
    return <>{children}</>;
};

export default PageStateHandler;
