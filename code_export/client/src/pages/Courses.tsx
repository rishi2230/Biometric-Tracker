import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Course } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, BookOpen } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const courseSchema = z.object({
  code: z.string().min(2, { message: "Course code must be at least 2 characters" }),
  name: z.string().min(2, { message: "Course name must be at least 2 characters" }),
  room: z.string().optional().or(z.literal("")),
  schedule: z.string().optional().or(z.literal("")),
  totalStudents: z.number().default(0),
});

export default function Courses() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Fetch courses
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Create form
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: "",
      name: "",
      room: "",
      schedule: "",
      totalStudents: 0,
    },
  });

  // Edit form
  const editForm = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: "",
      name: "",
      room: "",
      schedule: "",
      totalStudents: 0,
    },
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: (values: z.infer<typeof courseSchema>) => 
      apiRequest("POST", "/api/courses", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: t("success"),
        description: t("courseAdded"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("errorAddingCourse"),
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof courseSchema> & { id: number }) => 
      apiRequest("PATCH", `/api/courses/${values.id}`, {
        code: values.code,
        name: values.name,
        room: values.room,
        schedule: values.schedule,
        totalStudents: values.totalStudents,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: t("success"),
        description: t("courseUpdated"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("errorUpdatingCourse"),
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      toast({
        title: t("success"),
        description: t("courseDeleted"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("errorDeletingCourse"),
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onSubmit = (values: z.infer<typeof courseSchema>) => {
    createMutation.mutate(values);
  };

  const onEditSubmit = (values: z.infer<typeof courseSchema>) => {
    if (!selectedCourse) return;
    updateMutation.mutate({ ...values, id: selectedCourse.id });
  };

  const onDelete = () => {
    if (!selectedCourse) return;
    deleteMutation.mutate(selectedCourse.id);
  };

  // Open edit dialog with course data
  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    editForm.reset({
      code: course.code,
      name: course.name,
      room: course.room || "",
      schedule: course.schedule || "",
      totalStudents: course.totalStudents || 0,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDelete = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{t("courses")}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          {t("addCourse")}
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">{t("loadingCourses")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("room")}</TableHead>
                  <TableHead>{t("schedule")}</TableHead>
                  <TableHead>{t("students")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses?.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {course.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.room || "-"}</TableCell>
                    <TableCell>{course.schedule || "-"}</TableCell>
                    <TableCell>{course.totalStudents || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(course)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(course)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {(!courses || courses.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      {t("noCoursesYet")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Course Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addNewCourse")}</DialogTitle>
            <DialogDescription>
              {t("enterCourseDetails")}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courseCode")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="CS101" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courseName")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Computer Science 101" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("room")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Room 305B" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("schedule")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Monday, Wednesday 2:30 PM" />
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
                  {createMutation.isPending ? t("adding") : t("addCourse")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editCourse")}</DialogTitle>
            <DialogDescription>
              {t("updateCourseDetails")}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courseCode")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courseName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("room")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("schedule")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                  {updateMutation.isPending ? t("updating") : t("updateCourse")}
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
            <DialogTitle>{t("deleteCourse")}</DialogTitle>
            <DialogDescription>
              {t("deleteCourseConfirmation")}
            </DialogDescription>
          </DialogHeader>
          
          <p className="text-sm text-gray-500">
            {t("deleteCourseWarning")}
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
