import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Pending from './pages/Pending';
import Budget from './pages/Budget';
import Cards from './pages/Cards';
import Investments from './pages/Investments';
import Reports from './pages/Reports';
import Import from './pages/Import';
import Login from './pages/Login';
import { storage } from './lib/storage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const session = storage.getSession();
  return session ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/transactions" element={
          <PrivateRoute>
            <Layout><Transactions /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/pending" element={
          <PrivateRoute>
            <Layout><Pending /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/budget" element={
          <PrivateRoute>
            <Layout><Budget /></Layout>
          </PrivateRoute>
        } />

        <Route path="/cards" element={
          <PrivateRoute>
            <Layout><Cards /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/investments" element={
          <PrivateRoute>
            <Layout><Investments /></Layout>
          </PrivateRoute>
        } />
        
        <Route path="/reports" element={
          <PrivateRoute>
            <Layout><Reports /></Layout>
          </PrivateRoute>
        } />

        <Route path="/import" element={
          <PrivateRoute>
            <Layout><Import /></Layout>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
