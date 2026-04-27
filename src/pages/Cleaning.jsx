import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import {
  Plus,
  Sparkles,
  ClipboardList,
  Clock,
  CheckCircle2,
  PlayCircle,
  Calendar,
  User,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { he } from 'date-fns/locale';
import { MaintenanceRequestForm } from '@/components/forms/MaintenanceRequestForm';
import { emptyMaintenanceRequestFormValues } from '@/components/forms/atlasFormSchemas';

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DONE: 'bg-green-100 text-green-700 border-green-200'
};

const statusLabels = {
  OPEN: 'פתוח',
  IN_PROGRESS: 'בתהליך',
  DONE: 'הושלם'
};

export default function Cleaning({ user, selectedPropertyId, orgId, properties }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();
  const maintenanceDialogInterceptRef = useRef(null);

  useEffect(() => {
    if (!isCreateOpen) maintenanceDialogInterceptRef.current = null;
  }, [isCreateOpen]);

  const maintenanceFormDefaults = useMemo(() => emptyMaintenanceRequestFormValues(), [isCreateOpen]);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['cleaningTasks', orgId, selectedPropertyId],
    queryFn: async () => {
      const filters = { org_id: orgId };
      if (selectedPropertyId) filters.property_id = selectedPropertyId;
      return base44.entities.CleaningTask.filter(filters, 'scheduled_for', 500);
    },
    enabled: !!orgId,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', orgId],
    queryFn: () => base44.entities.Booking.filter({ org_id: orgId }, '-check_out_date', 50),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return base44.entities.CleaningTask.create({
        ...payload,
        org_id: orgId,
        property_id: selectedPropertyId,
        status: 'OPEN',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaningTasks'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: payload }) => {
      return base44.entities.CleaningTask.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaningTasks'] });
    },
  });

  const handleStatusChange = (taskId, newStatus) => {
    updateMutation.mutate({ id: taskId, data: { status: newStatus } });
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  const closeMaintenanceDialog = () => {
    setIsCreateOpen(false);
  };

  const handleMaintenanceSubmit = async (data) => {
    await createMutation.mutateAsync({
      ...data,
      org_id: orgId,
      property_id: selectedPropertyId,
      status: 'OPEN',
    });
  };

  const handleChecklistToggle = (taskId, index, currentChecklist) => {
    const updatedChecklist = [...currentChecklist];
    updatedChecklist[index] = { ...updatedChecklist[index], done: !updatedChecklist[index].done };
    updateMutation.mutate({ id: taskId, data: { checklist: updatedChecklist } });
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, checklist: updatedChecklist });
    }
  };

  // Filter and group tasks
  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  const groupedTasks = {
    overdue: filteredTasks.filter(t => t.scheduled_for && isPast(parseISO(t.scheduled_for)) && !isToday(parseISO(t.scheduled_for)) && t.status !== 'DONE'),
    today: filteredTasks.filter(t => t.scheduled_for && isToday(parseISO(t.scheduled_for))),
    tomorrow: filteredTasks.filter(t => t.scheduled_for && isTomorrow(parseISO(t.scheduled_for))),
    upcoming: filteredTasks.filter(t => {
      if (!t.scheduled_for) return false;
      const date = parseISO(t.scheduled_for);
      return !isPast(date) && !isToday(date) && !isTomorrow(date);
    })
  };

  const TaskCard = ({ task }) => {
    const completedItems = task.checklist?.filter(item => item.done).length || 0;
    const totalItems = task.checklist?.length || 0;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
      <Card 
        className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setSelectedTask(task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#00D1C1]" />
              <div>
                <p className="font-medium text-sm">
                  {task.scheduled_for && format(parseISO(task.scheduled_for), 'HH:mm')}
                </p>
                <p className="text-xs text-gray-500">
                  {task.scheduled_for && format(parseISO(task.scheduled_for), 'EEEE d/M', { locale: he })}
                </p>
              </div>
            </div>
            <Badge className={`${statusColors[task.status]} border`}>
              {statusLabels[task.status]}
            </Badge>
          </div>

          {task.assigned_to_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <User className="h-4 w-4" />
              <span>{task.assigned_to_name}</span>
            </div>
          )}

          {totalItems > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>התקדמות</span>
                <span>{completedItems}/{totalItems}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#00D1C1] h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const TaskGroup = ({ title, tasks, icon: Icon, color }) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <h3 className="font-semibold text-[#0B1220]">{title}</h3>
          <Badge variant="outline" className="text-xs">{tasks.length}</Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול ניקיון</h1>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mr-12">נהל משימות ניקיון לכל הנכסים. הקצה משימות לצוות, עקוב אחר סטטוס ותזמן ניקיונות.</p>
        <p className="text-indigo-500 text-xs mt-1 mr-12">טיפ: משימות חדשות נוצרות אוטומטית לפי הזמנות צ'ק-אאוט</p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">משימות ניקיון</h1>
          <p className="text-gray-500">צור משימות ניקיון והקצה אותן לצוות. צוות הניקיון יכול להתחבר ולראות רק את המשימות שלו, לסמן צ'קליסטים ולעדכן סטטוס.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] rounded-xl">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            משימה חדשה
          </Button>
        </div>
      </div>

      {/* Tasks Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-2xl animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-2">אין משימות ניקיון</p>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                צור את משימת הניקיון הראשונה שלך. משימות נוצרות אוטומטית מהזמנות צ'ק-אאוט, או שתוכל ליצור ידנית.
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="lg"
                className="gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl"
              >
                <Plus className="w-4 h-4" />
                משימת ניקיון חדשה
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ErrorBoundary
          section="maintenance-board"
          variant="inline"
          resetKey={`${orgId ?? 'no-org'}|${selectedPropertyId ?? 'all'}`}
        >
        <div className="space-y-8">
          <TaskGroup 
            title="באיחור" 
            tasks={groupedTasks.overdue} 
            icon={Clock} 
            color="text-red-500" 
          />
          <TaskGroup 
            title="היום" 
            tasks={groupedTasks.today} 
            icon={Calendar} 
            color="text-blue-500" 
          />
          <TaskGroup 
            title="מחר" 
            tasks={groupedTasks.tomorrow} 
            icon={Calendar} 
            color="text-purple-500" 
          />
          <TaskGroup 
            title="קרוב" 
            tasks={groupedTasks.upcoming} 
            icon={Calendar} 
            color="text-gray-500" 
          />
        </div>
        </ErrorBoundary>
      )}

      {/* Task Details Sheet */}
      <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <SheetContent side="left" className="w-full sm:w-[500px] overflow-y-auto">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle className="text-right flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#00D1C1]" />
                  משימת ניקיון
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {selectedTask.scheduled_for && format(parseISO(selectedTask.scheduled_for), 'EEEE, d MMMM yyyy בשעה HH:mm', { locale: he })}
                      </span>
                    </div>
                    <Badge className={`${statusColors[selectedTask.status]} border`}>
                      {statusLabels[selectedTask.status]}
                    </Badge>
                  </div>
                  {selectedTask.assigned_to_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedTask.assigned_to_name}</span>
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                <div className="flex gap-2">
                  {selectedTask.status === 'OPEN' && (
                    <Button 
                      className="flex-1 rounded-xl gap-2"
                      variant="outline"
                      onClick={() => handleStatusChange(selectedTask.id, 'IN_PROGRESS')}
                    >
                      <PlayCircle className="h-4 w-4" />
                      התחל
                    </Button>
                  )}
                  {selectedTask.status === 'IN_PROGRESS' && (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl gap-2"
                      onClick={() => handleStatusChange(selectedTask.id, 'DONE')}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      סיים
                    </Button>
                  )}
                  {selectedTask.status === 'DONE' && (
                    <Button 
                      className="flex-1 rounded-xl gap-2"
                      variant="outline"
                      onClick={() => handleStatusChange(selectedTask.id, 'OPEN')}
                    >
                      פתח מחדש
                    </Button>
                  )}
                </div>

                {/* Checklist */}
                {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold">רשימת בדיקה</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedTask.checklist.map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleChecklistToggle(selectedTask.id, index, selectedTask.checklist)}
                        >
                          <Checkbox checked={item.done} />
                          <span className={item.done ? 'line-through text-gray-400' : ''}>
                            {item.item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedTask.notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">הערות</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTask.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Task Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          const h = maintenanceDialogInterceptRef.current;
          if (h) {
            h(open);
            return;
          }
          setIsCreateOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>משימת ניקיון חדשה</DialogTitle>
          </DialogHeader>
          <MaintenanceRequestForm
            key={`${orgId}-${selectedPropertyId || 'all'}-${isCreateOpen}`}
            storageSuffix={`${orgId}-${selectedPropertyId || 'all'}`}
            defaultValues={maintenanceFormDefaults}
            onSubmit={handleMaintenanceSubmit}
            onCancel={closeMaintenanceDialog}
            setDialogOpen={setIsCreateOpen}
            onRegisterDialogInterceptor={(fn) => {
              maintenanceDialogInterceptRef.current = fn;
            }}
            onAfterSubmitSuccess={() => {
              window.setTimeout(closeMaintenanceDialog, 2000);
            }}
            submitLabel="צור משימה"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}