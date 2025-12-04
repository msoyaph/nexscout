import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Minus, CreditCard, Users, Calendar } from 'lucide-react';
import {
  getTeamSubscription,
  updateTeamSeats,
  getUpcomingInvoice,
  getSeatUtilization,
  type TeamSubscription,
  type BillingInvoice,
} from '../../services/team/teamBillingService';
import { useUser } from '../../hooks/useUser';

interface TeamBillingPageProps {
  onBack?: () => void;
}

export default function TeamBillingPage({ onBack }: TeamBillingPageProps) {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [teamSub, setTeamSub] = useState<TeamSubscription | null>(null);
  const [invoice, setInvoice] = useState<BillingInvoice | null>(null);
  const [utilization, setUtilization] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [seatChange, setSeatChange] = useState<number>(0);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [user.id]);

  async function loadData() {
    if (!user.id) return;

    setLoading(true);
    setError('');

    try {
      const [subData, invoiceData, utilData] = await Promise.all([
        getTeamSubscription(user.id),
        getUpcomingInvoice(user.id),
        getSeatUtilization(user.id),
      ]);

      setTeamSub(subData);
      setInvoice(invoiceData);
      setUtilization(utilData);
    } catch (err) {
      console.error('Error loading team billing:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateSeats() {
    if (!teamSub || !user.id) return;

    const newExtraSeats = (teamSub.extra_seats || 0) + seatChange;

    if (newExtraSeats < 0) {
      setError('Cannot have negative extra seats');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const result = await updateTeamSeats(
        user.id,
        teamSub.id,
        teamSub.seats_included || 5,
        newExtraSeats,
        teamSub.extra_seat_price || 899
      );

      if (result.success) {
        setModalOpen(false);
        setSeatChange(0);
        await loadData();
      } else {
        setError(result.error || 'Failed to update seats');
      }
    } catch (err) {
      console.error('Error updating seats:', err);
      setError('An error occurred while updating seats');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading team billing...</p>
        </div>
      </div>
    );
  }

  if (!teamSub) {
    return (
      <div className="min-h-screen bg-[#F0F2F5]">
        <div className="bg-white border-b shadow-sm p-4">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}
          <h1 className="text-xl font-semibold">Team Billing</h1>
        </div>
        <div className="max-w-3xl mx-auto p-4 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No team subscription found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Upgrade to a Team plan to access team billing features.
          </p>
        </div>
      </div>
    );
  }

  const basePrice = teamSub.base_price || 4990;
  const extraSeats = teamSub.extra_seats || 0;
  const extraSeatPrice = teamSub.extra_seat_price || 899;
  const total = invoice?.total || (basePrice + extraSeats * extraSeatPrice);

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24">
      {/* HEADER */}
      <div className="bg-white border-b shadow-sm p-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}
        <h1 className="text-xl font-semibold">Team Billing</h1>
        <p className="text-gray-500 text-sm leading-tight">
          Manage seats and view your team's monthly billing.
        </p>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="max-w-3xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
            {error}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* SEAT UTILIZATION CARD */}
        {utilization && (
          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Seat Utilization</h2>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {utilization.used_seats} / {utilization.total_seats} seats used
                </span>
                <span className="font-medium text-gray-900">{utilization.utilization_percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${utilization.utilization_percent}%` }}
                ></div>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              {utilization.available_seats} seat{utilization.available_seats !== 1 ? 's' : ''} available for new members
            </p>
          </div>
        )}

        {/* BILLING SUMMARY CARD */}
        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Billing Summary</h2>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium">Team Leader Pack</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Base Seats:</span>
              <span className="font-medium">{teamSub.seats_included || 5} seats</span>
            </div>

            {extraSeats > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Extra Seats:</span>
                <span className="font-medium">
                  {extraSeats} × ₱{extraSeatPrice.toLocaleString()} = ₱{(extraSeats * extraSeatPrice).toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600">Status:</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                teamSub.status === 'active' ? 'bg-green-100 text-green-800' :
                teamSub.status === 'past_due' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {teamSub.status}
              </span>
            </div>
          </div>

          <hr className="my-3" />

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">Monthly Total:</span>
            <span className="text-2xl font-bold text-gray-900">₱{total.toLocaleString()}</span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            Add / Remove Seats
          </button>
        </div>

        {/* NEXT BILLING CARD */}
        {invoice && (
          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Next Billing Cycle</h2>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Period:</span>
                <span className="font-medium">
                  {teamSub.billing_cycle_start} → {teamSub.billing_cycle_end}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{invoice.due_date}</span>
              </div>

              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Amount Due:</span>
                <span className="text-lg font-bold text-gray-900">₱{invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEAT ADJUSTMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Adjust Seats</h3>

            <p className="text-sm text-gray-600 mb-3">
              Current extra seats: <strong>{extraSeats}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change in seats (+ to add, - to remove)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSeatChange(Math.max(-extraSeats, seatChange - 1))}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={seatChange}
                  onChange={(e) => setSeatChange(Number(e.target.value))}
                  className="flex-1 border rounded-lg px-3 py-2 text-center"
                  placeholder="0"
                />
                <button
                  onClick={() => setSeatChange(seatChange + 1)}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {seatChange !== 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>New total:</strong> {extraSeats + seatChange} extra seats
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Monthly cost:</strong> ₱{(basePrice + (extraSeats + seatChange) * extraSeatPrice).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                className="flex-1 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => {
                  setModalOpen(false);
                  setSeatChange(0);
                  setError('');
                }}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpdateSeats}
                disabled={updating || seatChange === 0}
              >
                {updating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
