import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MembersList from './components/MembersList';
import LoansList from './components/LoansList';
import ReportsView from './components/ReportsView';
import AddMemberModal from './components/AddMemberModal';
import CreateLoanModal from './components/CreateLoanModal';
import LoanDetailModal from './components/LoanDetailModal';

export default function App() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isCreateLoanOpen, setIsCreateLoanOpen] = useState(false);
  const [preselectedMemberId, setPreselectedMemberId] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [isLoanDetailOpen, setIsLoanDetailOpen] = useState(false);

  // Fetch core data
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [membersRes, loansRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/loans')
      ]);

      if (membersRes.ok && loansRes.ok) {
        const [membersData, loansData] = await Promise.all([
          membersRes.json(),
          loansRes.json()
        ]);
        setMembers(membersData);
        setLoans(loansData);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Modal handlers
  const handleOpenCreateLoanForMember = (memberId) => {
    setPreselectedMemberId(memberId);
    setIsCreateLoanOpen(true);
  };

  const handleOpenLoanDetail = (loanId) => {
    setSelectedLoanId(loanId);
    setIsLoanDetailOpen(true);
  };

  const handleMemberAdded = (newMember) => {
    fetchData();
  };

  const handleLoanCreated = (newLoan) => {
    fetchData();
    // Open the detail schedule for the newly created loan
    if (newLoan?.id) {
      handleOpenLoanDetail(newLoan.id);
    }
  };

  const handleLoanUpdated = () => {
    fetchData();
  };

  // If user is not authenticated, render Login Page
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDataReset={fetchData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            members={members}
            loans={loans}
            onOpenAddMember={() => setIsAddMemberOpen(true)}
            onOpenCreateLoan={() => {
              setPreselectedMemberId('');
              setIsCreateLoanOpen(true);
            }}
            onOpenLoanDetail={handleOpenLoanDetail}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'members' && (
          <MembersList
            members={members}
            onOpenAddMember={() => setIsAddMemberOpen(true)}
            onOpenCreateLoanForMember={handleOpenCreateLoanForMember}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'loans' && (
          <LoansList
            loans={loans}
            onOpenCreateLoan={() => {
              setPreselectedMemberId('');
              setIsCreateLoanOpen(true);
            }}
            onOpenLoanDetail={handleOpenLoanDetail}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onMemberAdded={handleMemberAdded}
      />

      <CreateLoanModal
        isOpen={isCreateLoanOpen}
        onClose={() => setIsCreateLoanOpen(false)}
        members={members}
        preselectedMemberId={preselectedMemberId}
        onLoanCreated={handleLoanCreated}
      />

      <LoanDetailModal
        isOpen={isLoanDetailOpen}
        loanId={selectedLoanId}
        onClose={() => {
          setIsLoanDetailOpen(false);
          setSelectedLoanId(null);
        }}
        onLoanUpdated={handleLoanUpdated}
      />

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        Loan EMI Tracker &bull; 8% p.a. Reducing-Balance Amortization Engine
      </footer>
    </div>
  );
}
