import { Box, Button, TextField,MenuItem } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../../components/Header";
import theme from "../../../app/theme";
import { useLocation } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useListRolesQuery,
} from "../userApi";

const Form = () => {
  const location = useLocation();
  const user = location.state?.user;
  const isEdit = !!user;
  const { t } = useTranslation();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const { data: roles = [], isLoading: rolesLoading } = useListRolesQuery();
  const initialValues = user
    ? {
        username: user.username || "",
        firstName: user.full_name ? user.full_name.split(" ")[0] : "",
        lastName: user.full_name ? user.full_name.split(" ").slice(1).join(" ") : "",
        email: user.email || "",
        password: "",
        role_id: user.role_id || "",
        is_active: user.is_active !== undefined ? user.is_active : true,
      }
    : {
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role_id: "",

        is_active: true,
      };
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const navigate = useNavigate();
  const handleFormSubmit = async (values) => {
    const submitValues = {
      username: values.username,
      full_name: values.firstName + ' ' + values.lastName,
      email: values.email,
      password: values.password,
      role_id: Number(values.role_id),
      is_active: values.is_active ?? true,
    };
    try {
      if (isEdit) {
        await updateUser({ id: user.id, data: submitValues }).unwrap();
      } else {
        await createUser(submitValues).unwrap();
      }
      navigate("/team", { state: { refresh: true } });
    } catch (e) {
      alert(t('user.submitFailed'));
    }
  };

  return (
    <Box p="1rem" sx={{ bgcolor: theme.palette.background.paper, height: '100%', margin: 'auto', width: '75vw' }}>
      <Header title={isEdit ? t('user.editUser') : t('user.createUser')}
        subtitle={isEdit ? t('user.editUserProfile') : t('user.createUserProfile')} />
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema(t, isEdit)}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
              }}
            >
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label={t('user.username')}
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.username}
                name="username"
                error={!!touched.username && !!errors.username}
                helperText={touched.username && errors.username}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label={t('user.firstName')}
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.firstName}
                name="firstName"
                error={!!touched.firstName && !!errors.firstName}
                helperText={touched.firstName && errors.firstName}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label={t('user.lastName')}
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.lastName}
                name="lastName"
                error={!!touched.lastName && !!errors.lastName}
                helperText={touched.lastName && errors.lastName}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label={t('user.email')}
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.email}
                name="email"
                error={!!touched.email && !!errors.email}
                helperText={touched.email && errors.email}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="password"
                label={t('user.password')}
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.password}
                name="password"
                error={!!touched.password && !!errors.password}
                helperText={touched.password && errors.password}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                label={t('user.role')}
                select
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.role_id}
                name="role_id"
                sx={{ gridColumn: "span 2" }}
                required
              >
                {rolesLoading ? (
                  <MenuItem value="">{t('user.loadingRoles')}</MenuItem>
                ) : roles.length === 0 ? (
                  <MenuItem value="">{t('user.noRoles')}</MenuItem>
                ) : (
                  roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Box>
            <Box display="flex" justifyContent="end" mt="20px">
              <Button type="submit" color="secondary" variant="contained">
                {isEdit ? t('user.updateUser') : t('user.createUser')}
              </Button>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

const phoneRegExp =
  /^((\+[1-9]{1,4}[ -]?)|(\([0-9]{2,3}\)[ -]?)|([0-9]{2,4})[ -]?)*?[0-9]{3,4}[ -]?[0-9]{3,4}$/;

const checkoutSchema = (t, isEdit) => yup.object().shape({
  username: yup.string().required(t('user.required')),
  firstName: yup.string().required(t('user.required')),
  lastName: yup.string().required(t('user.required')),
  email: yup.string().email(t('user.invalidEmail')).required(t('user.required')),
  password: isEdit ? yup.string() : yup.string().required(t('user.required')),

  role_id: yup.number().required(t('user.required')),
});

export default Form;
