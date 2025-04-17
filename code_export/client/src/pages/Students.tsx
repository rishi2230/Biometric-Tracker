import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Student } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Trash2, Plus, User } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const studentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  studentId: z.string().min(1, { message: "Student ID is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  courses: z.array(z.string()).default([]),
});

export default function Students() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch students
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Create form
  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      studentId: "",
      email: "",
      courses: [],
    },
  });

  // Edit form
  const editForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      studentId: "",
      email: "",
      courses: [],
    },
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (values: z.infer<typeof studentSchema>) => 
      apiRequest("POST", "/api/students", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: t("success"),
        description: t("studentAdded"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("errorAddingStudent"),
        variant: "destructive",
      });
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof studentSchema> & { id: number }) => 
      apiRequest("PATCH", `/api/students/${values.id}`, {
        name: values.name,
        studentId: values.studentId,
        email: values.email,
        courses: values.courses,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: t("success"),
        description: t("studentUpdated"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("errorUpdatingStudent"),
        variant: "destructive",
      });
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      toast({
        title: t("success"),
        description: t("studentDeleted"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("errorDeletingStudent"),
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onSubmit = (values: z.infer<typeof studentSchema>) => {
    createMutation.mutate(values);
  };

  const onEditSubmit = (values: z.infer<typeof studentSchema>) => {
    if (!selectedStudent) return;
    updateMutation.mutate({ ...values, id: selectedStudent.id });
  };

  const onDelete = () => {
    if (!selectedStudent) return;
    deleteMutation.mutate(selectedStudent.id);
  };

  // Open edit dialog with student data
  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    editForm.reset({
      name: student.name,
      studentId: student.studentId,
      email: student.email || "",
      courses: student.courses || [],
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{t("students")}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          {t("addStudent")}
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">{t("loadingStudents")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("studentId")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("courses")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.email || "-"}</TableCell>
                    <TableCell>
                      {student.courses?.length 
                        ? student.courses.join(", ") 
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(student)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(student)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {(!students || students.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      {t("noStudentsYet")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addNewStudent")}</DialogTitle>
            <DialogDescription>
              {t("enterStudentDetails")}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("studentId")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? t("adding") : t("addStudent")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editStudent")}</DialogTitle>
            <DialogDescription>
              {t("updateStudentDetails")}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("studentId")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? t("updating") : t("updateStudent")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteStudent")}</DialogTitle>
            <DialogDescription>
              {t("deleteStudentConfirmation")}
            </DialogDescription>
          </DialogHeader>
          
          <p className="text-sm text-gray-500">
            {t("deleteStudentWarning")}
          </p>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
