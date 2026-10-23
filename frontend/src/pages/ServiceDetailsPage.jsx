import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import AlertMessage from '../components/AlertMessage';
import ConfirmModal from '../components/ConfirmModal';

export default function ServiceDetailsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedBookingId = searchParams.get('booking_id') || '';

  const [details, setDetails] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add / Edit Service Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    service_detail_id: null,
    booking_id: selectedBookingId || '',
    service_type_id: '',
    mechanic_id: '',
    labor_cost: '0.00',
    service_notes: '',
    status: 'In Progress',
  });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Add Part Modal
  const [showPartModal, setShowPartModal] = useState(false);
  const [partTargetDetailId, setPartTargetDetailId] = useState(null);
  const [partForm, setPartForm] = useState({
    part_id: '',
    quantity: 1,
  });
  const [partSubmitting, setPartSubmitting] = useState(false);

  // Expanded parts map for each detail item: { [detail_id]: PartsUsed[] }
  const [partsUsedMap, setPartsUsedMap] = useState({});

  // Delete Modals
  const [deleteDetailTarget, setDeleteDetailTarget] = useState(null);
  const [deletePartTarget, setDeletePartTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReferenceData = async () => {
    try {
      const [bData, stData, mData, spData] = await Promise.all([
        api.get('/bookings'),
        api.get('/service-types'),
        api.get('/mechanics?active_only=true'),
        api.get('/spare-parts'),
      ]);
      setBookings(bData);
      setServiceTypes(stData);
      setMechanics(mData);
      setSpareParts(spData);
    } catch (err) {
      console.error('Failed to load reference data:', err);
    }
  };

  const loadDetails = async () => {
    try {
      setLoading(true);
      const url = selectedBookingId ? `/service-details?booking_id=${selectedBookingId}` : '/service-details';
      const data = await api.get(url);
      setDetails(data);

      // Load parts used for all fetched details
      const newMap = {};
      await Promise.all(
        data.map(async (d) => {
          const parts = await api.get(`/parts-used?service_detail_id=${d.service_detail_id}`);
          newMap[d.service_detail_id] = parts;
        })
      );
      setPartsUsedMap(newMap);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadDetails();
  }, [selectedBookingId]);

  const handleOpenAddTask = () => {
    setIsEditingTask(false);
    setTaskForm({
      service_detail_id: null,
      booking_id: selectedBookingId || (bookings.length > 0 ? bookings[0].booking_id : ''),
      service_type_id: serviceTypes.length > 0 ? serviceTypes[0].service_type_id : '',
      mechanic_id: mechanics.length > 0 ? mechanics[0].mechanic_id : '',
      labor_cost: serviceTypes.length > 0 ? serviceTypes[0].base_cost : '0.00',
      service_notes: '',
      status: 'In Progress',
    });
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (d) => {
    setIsEditingTask(true);
    setTaskForm({
      service_detail_id: d.service_detail_id,
      booking_id: d.booking_id,
      service_type_id: d.service_type_id,
      mechanic_id: d.mechanic_id,
      labor_cost: d.labor_cost,
      service_notes: d.service_notes || '',
      status: d.status,
    });
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      if (isEditingTask) {
        await api.put(`/service-details/${taskForm.service_detail_id}`, {
          service_type_id: Number(taskForm.service_type_id),
          mechanic_id: Number(taskForm.mechanic_id),
          labor_cost: Number(taskForm.labor_cost),
          service_notes: taskForm.service_notes || null,
          status: taskForm.status,
        });
        setAlert({ type: 'success', message: 'Service task line item updated.' });
      } else {
        await api.post('/service-details', {
          booking_id: Number(taskForm.booking_id),
          service_type_id: Number(taskForm.service_type_id),
          mechanic_id: Number(taskForm.mechanic_id),
          labor_cost: Number(taskForm.labor_cost),
          service_notes: taskForm.service_notes || null,
          status: taskForm.status,
        });
        setAlert({ type: 'success', message: 'Service task assigned to booking.' });
      }
      setShowTaskModal(false);
      loadDetails();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleOpenAddPart = (detailId) => {
    setPartTargetDetailId(detailId);
    setPartForm({
      part_id: spareParts.length > 0 ? spareParts[0].part_id : '',
      quantity: 1,
    });
    setShowPartModal(true);
  };

  const handlePartSubmit = async (e) => {
    e.preventDefault();
    setPartSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await api.post('/parts-used', {
        service_detail_id: partTargetDetailId,
        part_id: Number(partForm.part_id),
        quantity: Number(partForm.quantity),
      });
      setAlert({
        type: 'success',
        message: `Installed ${res.quantity}x '${res.part_name}'. Database trigger deducted stock!`,
      });
      setShowPartModal(false);
      loadDetails();
      // Refresh inventory catalog for stock values
      loadReferenceData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setPartSubmitting(false);
    }
  };

  const handleDeleteDetail = async () => {
    if (!deleteDetailTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/service-details/${deleteDetailTarget.service_detail_id}`);
      setAlert({ type: 'success', message: `Service Detail #${deleteDetailTarget.service_detail_id} deleted.` });
      setDeleteDetailTarget(null);
      loadDetails();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setDeleteDetailTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePart = async () => {
    if (!deletePartTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/parts-used/${deletePartTarget.usage_id}`);
      setAlert({ type: 'success', message: res.message });
      setDeletePartTarget(null);
      loadDetails();
      loadReferenceData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setDeletePartTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Service Operations & Parts Allocation</h2>
          <p className="text-muted small mb-0">Assign mechanics, specify labor charges, and allocate spare parts</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAddTask}>
          <i className="bi bi-plus-circle me-1"></i>Assign Service Task
        </button>
      </div>

      <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Booking Filter Selector */}
      <div className="card shadow-sm border-0 mb-4 rounded-3">
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '480px' }}>
            <label className="fw-semibold small text-nowrap">Filter by Booking:</label>
            <select
              className="form-select form-select-sm"
              value={selectedBookingId}
              onChange={(e) => setSearchParams(e.target.value ? { booking_id: e.target.value } : {})}
            >
              <option value="">All Bookings (Overview)</option>
              {bookings.map((b) => (
                <option key={b.booking_id} value={b.booking_id}>
                  Booking #{b.booking_id} - {b.registration_number} ({b.customer_name}) [{b.status}]
                </option>
              ))}
            </select>
          </div>
          {selectedBookingId && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSearchParams({})}>
              Show All
            </button>
          )}
        </div>
      </div>

      {/* Service Details Cards / Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary spinner-border-sm me-2"></div>
          Loading service operations and parts...
        </div>
      ) : details.length === 0 ? (
        <div className="card shadow-sm border-0 rounded-3 text-center py-5 text-muted">
          <i className="bi bi-tools fs-2 d-block mb-2"></i>
          No service details or tasks assigned yet. Click "Assign Service Task" above to add work items.
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {details.map((d) => {
            const partsList = partsUsedMap[d.service_detail_id] || [];
            return (
              <div key={d.service_detail_id} className="card shadow-sm border-0 rounded-3 overflow-hidden">
                <div className="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div>
                    <span className="badge bg-secondary me-2">Task #{d.service_detail_id}</span>
                    <strong className="fs-6 me-2">{d.service_type_name || `Service Type #${d.service_type_id}`}</strong>
                    <span className="text-muted small">
                      (Booking <Link to={`/bookings`}>#{d.booking_id}</Link>)
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`badge ${
                        d.status === 'Completed'
                          ? 'bg-success'
                          : d.status === 'In Progress'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary'
                      }`}
                    >
                      {d.status}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleOpenEditTask(d)}
                      title="Edit Task"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setDeleteDetailTarget(d)}
                      title="Delete Task"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="card-body p-3">
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <small className="text-muted d-block">Assigned Technician</small>
                      <div className="fw-semibold">
                        <i className="bi bi-person-badge text-primary me-1"></i>
                        {d.mechanic_name || `Mechanic #${d.mechanic_id}`}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted d-block">Labor Charge</small>
                      <div className="fw-bold text-dark">
                        ₹{Number(d.labor_cost).toFixed(2)}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted d-block">Total Parts Installed</small>
                      <div className="fw-bold text-success">
                        ₹{Number(d.total_parts_cost || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {d.service_notes && (
                    <div className="bg-light p-2 rounded small text-secondary mb-3">
                      <strong>Notes:</strong> {d.service_notes}
                    </div>
                  )}

                  {/* Parts Used Subsection */}
                  <div className="border-top pt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0 text-secondary" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-gear-fill me-1"></i>SPARE PARTS CONSUMED ({partsList.length})
                      </h6>
                      <button
                        className="btn btn-sm btn-outline-success py-1 px-2"
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => handleOpenAddPart(d.service_detail_id)}
                      >
                        <i className="bi bi-plus me-1"></i>Install Spare Part
                      </button>
                    </div>

                    {partsList.length === 0 ? (
                      <div className="text-muted small fst-italic py-1">
                        No spare parts installed for this task yet.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered align-middle mb-0 bg-white">
                          <thead className="table-light small text-secondary">
                            <tr>
                              <th>Part Name</th>
                              <th>Part Number</th>
                              <th className="text-center">Qty</th>
                              <th className="text-end">Unit Price</th>
                              <th className="text-end">Total Price</th>
                              <th className="text-center" style={{ width: '60px' }}>Remove</th>
                            </tr>
                          </thead>
                          <tbody>
                            {partsList.map((p) => (
                              <tr key={p.usage_id}>
                                <td className="fw-semibold">{p.part_name}</td>
                                <td><code>{p.part_number}</code></td>
                                <td className="text-center fw-bold">{p.quantity}</td>
                                <td className="text-end">₹{Number(p.unit_price).toFixed(2)}</td>
                                <td className="text-end fw-bold">₹{Number(p.total_cost).toFixed(2)}</td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-link text-danger p-0"
                                    onClick={() => setDeletePartTarget(p)}
                                    title="Remove part and restore inventory stock"
                                  >
                                    <i className="bi bi-x-circle-fill"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Task Modal */}
      {showTaskModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleTaskSubmit}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">
                    {isEditingTask ? 'Edit Service Task' : 'Assign Service Task to Booking'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowTaskModal(false)}></button>
                </div>
                <div className="modal-body">
                  {!isEditingTask && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Target Booking *</label>
                      <select
                        className="form-select"
                        required
                        value={taskForm.booking_id}
                        onChange={(e) => setTaskForm({ ...taskForm, booking_id: e.target.value })}
                      >
                        <option value="">Select booking appointment...</option>
                        {bookings.map((b) => (
                          <option key={b.booking_id} value={b.booking_id}>
                            Booking #{b.booking_id} - {b.registration_number} ({b.customer_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Service Catalog Operation *</label>
                    <select
                      className="form-select"
                      required
                      value={taskForm.service_type_id}
                      onChange={(e) => {
                        const stId = e.target.value;
                        const matched = serviceTypes.find((s) => String(s.service_type_id) === String(stId));
                        setTaskForm({
                          ...taskForm,
                          service_type_id: stId,
                          labor_cost: matched ? matched.base_cost : taskForm.labor_cost,
                        });
                      }}
                    >
                      <option value="">Select service catalog type...</option>
                      {serviceTypes.map((st) => (
                        <option key={st.service_type_id} value={st.service_type_id}>
                          {st.type_name} (Base Labor: ₹{st.base_cost})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Assigned Mechanic *</label>
                      <select
                        className="form-select"
                        required
                        value={taskForm.mechanic_id}
                        onChange={(e) => setTaskForm({ ...taskForm, mechanic_id: e.target.value })}
                      >
                        <option value="">Select technician...</option>
                        {mechanics.map((m) => (
                          <option key={m.mechanic_id} value={m.mechanic_id}>
                            {m.name} ({m.specialization})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Labor Charge (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        required
                        value={taskForm.labor_cost}
                        onChange={(e) => setTaskForm({ ...taskForm, labor_cost: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Progress Status *</label>
                    <select
                      className="form-select"
                      required
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Service Observation Notes</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Diagnostic observations, work performed, or recommendations"
                      value={taskForm.service_notes}
                      onChange={(e) => setTaskForm({ ...taskForm, service_notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowTaskModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={taskSubmitting}>
                    {taskSubmitting ? 'Saving...' : isEditingTask ? 'Update Task' : 'Add Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add / Install Spare Part Modal */}
      {showPartModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handlePartSubmit}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Install Spare Part</h5>
                  <button type="button" className="btn-close" onClick={() => setShowPartModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info py-2 small mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    Database trigger will verify available stock and automatically deduct inventory upon submission.
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Spare Part *</label>
                    <select
                      className="form-select"
                      required
                      value={partForm.part_id}
                      onChange={(e) => setPartForm({ ...partForm, part_id: e.target.value })}
                    >
                      <option value="">Select inventory part...</option>
                      {spareParts.map((sp) => (
                        <option key={sp.part_id} value={sp.part_id}>
                          {sp.part_name} [{sp.part_number}] - ₹{sp.unit_price} (Stock: {sp.stock_quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Quantity to Install *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      required
                      value={partForm.quantity}
                      onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPartModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={partSubmitting}>
                    {partSubmitting ? 'Validating Stock...' : 'Confirm & Deduct Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Task Modal */}
      <ConfirmModal
        isOpen={!!deleteDetailTarget}
        title="Delete Service Task"
        message={`Are you sure you want to remove Task #${deleteDetailTarget?.service_detail_id}? All parts allocated will be deleted and restored to inventory by database triggers.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDeleteDetail}
        onCancel={() => setDeleteDetailTarget(null)}
      />

      {/* Delete Part Used Modal */}
      <ConfirmModal
        isOpen={!!deletePartTarget}
        title="Remove Installed Part"
        message={`Are you sure you want to remove ${deletePartTarget?.quantity}x '${deletePartTarget?.part_name}'? The database trigger 'trg_parts_used_after_delete' will automatically restore this quantity back to stock.`}
        confirmText="Remove & Restore Stock"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDeletePart}
        onCancel={() => setDeletePartTarget(null)}
      />
    </div>
  );
}
