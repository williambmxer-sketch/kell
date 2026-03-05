import { useState } from 'react';
import { toast } from 'sonner';
import { Transaction, PaymentMethod, User } from '../types';
import {
    fetchTransactions as fetchTransactionsService,
    createTransaction as createTransactionService,
    deleteTransaction as deleteTransactionService,
    fetchPaymentMethods as fetchPaymentMethodsService,
    createPaymentMethod as createPaymentMethodService,
    deletePaymentMethod as deletePaymentMethodService,
    togglePaymentMethod as togglePaymentMethodService,
    fetchUsers as fetchUsersService,
    createUser as createUserService,
    updateUser as updateUserService,
    deleteUser as deleteUserService
} from '../services/supabase';

export function useFinance() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [mechanics, setMechanics] = useState<User[]>([]);

    const load = async () => {
        const [transactionsData, paymentMethodsData, usersData] = await Promise.all([
            fetchTransactionsService(),
            fetchPaymentMethodsService(),
            fetchUsersService()
        ]);
        setTransactions(transactionsData);
        setPaymentMethods(paymentMethodsData);
        setMechanics(usersData.filter(u => u.role === 'MECHANIC'));
    };

    // Transactions
    const addTransaction = async (transaction: Transaction) => {
        try {
            const newTransaction = await createTransactionService(transaction);
            setTransactions(prev => [newTransaction, ...prev]);
            toast.success('Transação registrada com sucesso!');
        } catch (err: any) {
            console.error('Failed to add transaction', err);
            toast.error(`Erro ao salvar transação: ${err.message || 'Tente novamente.'}`);
        }
    };

    const deleteTransaction = async (id: string) => {
        const backup = transactions;
        setTransactions(prev => prev.filter(t => t.id !== id));
        try {
            await deleteTransactionService(id);
            toast.success('Transação removida.');
        } catch (err) {
            console.error('Failed to delete transaction', err);
            setTransactions(backup);
            toast.error('Erro ao remover transação.');
        }
    };

    // Payment Methods
    const addPaymentMethod = async (name: string) => {
        try {
            const newMethod = await createPaymentMethodService(name);
            setPaymentMethods(prev => [...prev, newMethod]);
        } catch (err) {
            console.error('Failed to add payment method', err);
            toast.error('Erro ao adicionar forma de pagamento.');
        }
    };

    const deletePaymentMethod = async (id: string) => {
        setPaymentMethods(prev => prev.filter(p => p.id !== id));
        await deletePaymentMethodService(id);
    };

    const togglePaymentMethod = async (id: string, active: boolean) => {
        setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, active } : p));
        await togglePaymentMethodService(id, active);
    };

    // Mechanics (Users)
    const addUser = async (user: Omit<User, 'id'>) => {
        try {
            const newUser = await createUserService(user);
            setMechanics(prev => [...prev, newUser]);
        } catch (err) {
            console.error('Failed to add user', err);
            toast.error('Erro ao adicionar usuário.');
        }
    };

    const updateUser = async (id: string, user: Partial<User>) => {
        setMechanics(prev => prev.map(u => u.id === id ? { ...u, ...user } : u));
        await updateUserService(id, user);
    };

    const deleteUser = async (id: string) => {
        setMechanics(prev => prev.filter(u => u.id !== id));
        await deleteUserService(id);
    };

    return {
        transactions, setTransactions,
        paymentMethods, setPaymentMethods,
        mechanics, setMechanics,
        load,
        addTransaction, deleteTransaction,
        addPaymentMethod, deletePaymentMethod, togglePaymentMethod,
        addUser, updateUser, deleteUser
    };
}
