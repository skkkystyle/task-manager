import React, { useState } from 'react';
import {
  Title,
  Button,
  Group,
  Paper,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  Box,
  Text,
  Alert,
  Badge,
  Menu,
  Avatar,
  Container,
  Stack,
  Skeleton,
  Center,
  Flex,
  Divider,
  Card,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconAlertCircle,
  IconCheck,
  IconLogout,
  IconUser,
  IconSearch,
  IconClipboardList,
  IconCalendar,
  IconClock,
  IconX,
} from '@tabler/icons-react';
import api from '../services/api';
import { removeToken, getToken, isTokenValid } from '../utils/auth';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface Task {
  id: number;
  title:  string;
  description?:  string;
  status: TaskStatus;
  createdAt:  string;
  updatedAt?:  string;
}

interface TaskFormValues {
  title:  string;
  description:  string;
  status: TaskStatus;
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'К выполнению' },
  { value: 'IN_PROGRESS', label:  'В процессе' },
  { value: 'DONE', label: 'Выполнено' },
];

const STATUS_COLORS:  Record<TaskStatus, string> = {
  TODO: 'gray',
  IN_PROGRESS: 'blue',
  DONE: 'green',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В процессе',
  DONE: 'Выполнено',
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const formatDateTime = (dateString:  string): string => {
  return new Date(dateString).toLocaleString('ru-RU', {
    day: '2-digit',
    month:  '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getUserEmail = (): string => {
  const token = getToken();
  if (token && isTokenValid(token)) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || 'Пользователь';
    } catch {
      return 'Пользователь';
    }
  }
  return 'Пользователь';
};

interface TaskViewModalProps {
  task: Task | null;
  opened: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const TaskViewModal: React.FC<TaskViewModalProps> = ({
  task,
  opened,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!task) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconClipboardList size={20} />
          <Text fw={600}>Просмотр задачи</Text>
        </Group>
      }
      size="md"
      centered
    >
      <Stack gap="md">
        <div>
          <Text size="sm" c="dimmed" mb={4}>
            Название
          </Text>
          <Group justify="space-between" align="flex-start">
            <Text size="lg" fw={600} style={{ flex: 1, wordBreak: 'break-word' }}>
              {task.title}
            </Text>
            <Badge color={STATUS_COLORS[task.status]} variant="light" size="lg">
              {STATUS_LABELS[task.status]}
            </Badge>
          </Group>
        </div>

        <Divider />

        <div>
          <Text size="sm" c="dimmed" mb={4}>
            Описание
          </Text>
          <Card withBorder padding="sm" radius="sm" bg="gray.0">
            <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {task.description || 'Описание отсутствует'}
            </Text>
          </Card>
        </div>

        <div>
          <Text size="sm" c="dimmed" mb={8}>
            Информация
          </Text>
          <Stack gap="xs">
            <Group gap="xs">
              <IconCalendar size={16} color="gray" />
              <Text size="sm">Создано: {formatDateTime(task.createdAt)}</Text>
            </Group>
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <Group gap="xs">
                <IconClock size={16} color="gray" />
                <Text size="sm">Обновлено: {formatDateTime(task.updatedAt)}</Text>
              </Group>
            )}
          </Stack>
        </div>

        <Divider />

        <Group justify="space-between">
          <Button
            variant="light"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => {
              onClose();
              onDelete(task);
            }}
          >
            Удалить
          </Button>
          <Group gap="sm">
            <Button variant="default" onClick={onClose}>
              Закрыть
            </Button>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            >
              Редактировать
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};

const TasksPage:  React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editModalOpened, setEditModalOpened] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<TaskFormValues>({
    initialValues: {
      title: '',
      description: '',
      status: 'TODO',
    },
    validate: {
      title: (value) => (value.trim().length === 0 ? 'Название обязательно' :  null),
    },
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      const res = await api.get(`/tasks?${params.toString()}`);
      return res.data as Task[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TaskFormValues & { id?: number }) => {
      if (data.id) {
        return api.patch(`/tasks/${data.id}`, data).then((r) => r.data);
      }
      return api.post('/tasks', data).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey:  ['tasks'] });
      closeEditModal();
      notifications.show({
        title:  'Успешно',
        message: editingTask ? 'Задача обновлена' : 'Задача создана',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    },
    onError: () => {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить задачу',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      notifications.show({
        title: 'Успешно',
        message: 'Задача удалена',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    },
    onError: () => {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить задачу',
        color: 'red',
        icon:  <IconAlertCircle size={16} />,
      });
    },
  });

  const handleLogout = () => {
    removeToken();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  const openCreateModal = () => {
    setEditingTask(null);
    form.reset();
    setEditModalOpened(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    form.setValues({
      title: task.title,
      description: task.description || '',
      status:  task.status,
    });
    setEditModalOpened(true);
  };

  const closeEditModal = () => {
    setEditModalOpened(false);
    setEditingTask(null);
    form.reset();
  };

  const openViewModal = (task: Task) => {
    setSelectedTask(task);
    setViewModalOpened(true);
  };

  const closeViewModal = () => {
    setViewModalOpened(false);
    setSelectedTask(null);
  };

  const handleSubmit = (values:  TaskFormValues) => {
    saveMutation.mutate({
      ...values,
      id: editingTask?.id,
    });
  };

  const handleDelete = (task:  Task) => {
    if (window.confirm(`Удалить задачу "${task.title}"? `)) {
      deleteMutation.mutate(task.id);
    }
  };

  const tasks = tasksQuery.data || [];

  return (
    <>
      <Box
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e9ecef',
          padding: '12px 0',
        }}
      >
        <Container size="lg">
          <Flex justify="space-between" align="center">
            <Group gap="sm">
              <IconClipboardList size={24} color="#228be6" />
              <Title order={3}>Task Manager</Title>
            </Group>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="subtle">
                  <Group gap="xs">
                    <Avatar size="sm" radius="xl" color="blue">
                      <IconUser size={14} />
                    </Avatar>
                    <Text size="sm">{getUserEmail()}</Text>
                  </Group>
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                >
                  Выйти
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Flex>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <Flex justify="space-between" align="center" mb="lg">
          <div>
            <Title order={2}>Мои задачи</Title>
            <Text c="dimmed" size="sm">
              Всего:  {tasks.length}
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Новая задача
          </Button>
        </Flex>

        <Paper p="md" mb="lg" withBorder>
          <Group grow>
            <Select
              placeholder="Все статусы"
              data={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
            />
            <TextInput
              placeholder="Поиск..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightSection={
                searchQuery ? (
                  <ActionIcon size="sm" variant="subtle" onClick={() => setSearchQuery('')}>
                    <IconX size={14} />
                  </ActionIcon>
                ) : null
              }
            />
          </Group>
        </Paper>

        {tasksQuery.isLoading ? (
          <Stack>
            <Skeleton height={50} />
            <Skeleton height={50} />
            <Skeleton height={50} />
          </Stack>
        ) : tasksQuery.isError ? (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            Ошибка загрузки задач
          </Alert>
        ) : tasks.length === 0 ? (
          <Paper p="xl" withBorder>
            <Center>
              <Stack align="center">
                <IconClipboardList size={48} color="gray" />
                <Text c="dimmed">Задач нет</Text>
                <Button onClick={openCreateModal}>Создать первую задачу</Button>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Paper withBorder style={{ overflow: 'hidden' }}>
            <Table highlightOnHover style={{ tableLayout: 'fixed', width: '100%' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '25%' }}>Название</Table.Th>
                  <Table.Th style={{ width: '35%' }}>Описание</Table.Th>
                  <Table.Th style={{ width:  '15%' }}>Статус</Table.Th>
                  <Table.Th style={{ width: '12%' }}>Дата</Table.Th>
                  <Table.Th style={{ width: '13%' }}>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {tasks.map((task) => (
                  <Table.Tr
                    key={task.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openViewModal(task)}
                  >
                    <Table.Td
                      style={{
                        maxWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:  'nowrap',
                      }}
                    >
                      <Text fw={500} truncate="end" title={task.title}>
                        {task.title}
                      </Text>
                    </Table.Td>
                    <Table.Td
                      style={{
                        maxWidth: 0,
                        overflow:  'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Text size="sm" c="dimmed" truncate="end" title={task.description || '—'}>
                        {task.description || '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={STATUS_COLORS[task.status]} variant="light">
                        {STATUS_LABELS[task.status]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(task.createdAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap" onClick={(e) => e.stopPropagation()}>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => openEditModal(task)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(task)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Container>

      <TaskViewModal
        task={selectedTask}
        opened={viewModalOpened}
        onClose={closeViewModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title={editingTask ? 'Редактировать задачу' : 'Новая задача'}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Название"
              placeholder="Введите название"
              required
              {... form.getInputProps('title')}
            />
            <Textarea
              label="Описание"
              placeholder="Введите описание"
              rows={3}
              {...form.getInputProps('description')}
            />
            <Select
              label="Статус"
              data={STATUS_OPTIONS}
              value={form.values.status}
              onChange={(value) => form.setFieldValue('status', (value as TaskStatus) || 'TODO')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeEditModal}>
                Отмена
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {editingTask ? 'Сохранить' : 'Создать'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

export default TasksPage;